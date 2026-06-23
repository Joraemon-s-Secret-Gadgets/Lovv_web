# Seoul CDN 신설 런북 (lovv frontend dev)

서울 리전(`ap-northeast-2`)에 **새** S3 + CloudFront(OAC) 정적 호스팅을 만들고,
기존 미국(`us-east-1`) 배포는 **그대로 두는** 절차입니다. 백엔드 API는 기존
미국 엔드포인트를 계속 바라봅니다(프론트의 `VITE_LOVV_API_BASE_URL` 변경 없음).

> 이 환경(어시스턴트)에는 AWS 자격증명이 없어 직접 프로비저닝할 수 없습니다.
> 아래 스크립트/명령은 **AWS 권한이 있는 본인 머신에서** 실행하세요.

## 전제조건
- `aws` CLI v2, 자격증명(프로파일). 기본은 `AWS_PROFILE=default`.
  - 다른 프로파일이면 모든 명령 앞에 `AWS_PROFILE=<name>` 를 붙이세요.
- 권한: S3, CloudFront, (백엔드 배포 시) SAM/CloudFormation.
- 계정 ID: `925273580929` (다르면 `ACCOUNT_ID=...` 로 덮어쓰기).
- `node`/`npm`, 그리고 백엔드 배포용 `sam` CLI.

## 산출물
| 파일 | 역할 |
|---|---|
| `provision-seoul-cdn.sh` | S3(서울)+OAC+CloudFront+버킷정책 생성, 새 도메인 출력 |
| `configure-new-domain.sh` | 새 도메인을 백엔드 `parameters/dev.yaml`(CORS·Cognito)에 멱등 추가 |
| `release-seoul.sh` | 프론트 빌드 + S3 업로드 + CloudFront 무효화 (반복 실행용) |
| `.seoul-cdn.env` | 생성된 버킷/배포ID/도메인 (스크립트 간 공유, git 미추적) |

---

## 단계

### 0) 스크립트 실행권한
```bash
cd Lovv-pg
chmod +x deploy/*.sh
```

### 1) 서울 인프라 생성 (S3 + OAC + CloudFront)
```bash
./deploy/provision-seoul-cdn.sh
```
- 버킷명은 전역 유일성을 위해 `lovv-frontend-dev-seoul-925273580929` 사용
  (원하면 `SEOUL_BUCKET=... ./deploy/provision-seoul-cdn.sh`).
- 모든 퍼블릭 액세스 차단 + **OAC로 CloudFront만 S3 읽기 허용**(버킷정책).
- 끝나면 새 도메인 `https://dXXXX.cloudfront.net` 이 출력되고
  `deploy/.seoul-cdn.env` 에 저장됩니다.
- CloudFront 전파에 5~15분:
  ```bash
  source deploy/.seoul-cdn.env
  aws cloudfront wait distribution-deployed --id "$SEOUL_DISTRIBUTION_ID"
  ```

> **접근제어 주의:** 스크립트의 4단계(S3 버킷정책)는 리소스 접근 권한을 바꿉니다.
> 명령을 한 번 검토한 뒤 본인이 직접 실행하세요.

### 2) 새 도메인을 Cognito/CORS에 등록 (가장 중요)
```bash
./deploy/configure-new-domain.sh https://dXXXX.cloudfront.net
```
`Lovv_BE/parameters/dev.yaml` 의 다음 3개 값에 새 도메인이 멱등 추가됩니다.
- `AllowedCorsOrigin` ← `https://dXXXX.cloudfront.net`
- `CognitoCallbackUrls` ← `https://dXXXX.cloudfront.net/auth/callback/cognito`
- `CognitoLogoutUrls` ← `https://dXXXX.cloudfront.net/`

그 다음 **백엔드 재배포**로 Cognito 앱 클라이언트 + CORS에 반영:
```bash
cd ../Lovv_BE
sam deploy --config-env default     # 스택: lovv-dev-api (ap-northeast-2)
cd -
```

> **확인 필요:** 프론트 `.env.production` 의 Cognito 도메인은
> `...auth.us-east-1.amazoncognito.com` 인데 SAM 스택은 `ap-northeast-2` 입니다.
> 실제 User Pool이 이 SAM 스택이 아니라 콘솔/다른 곳에서 관리된다면,
> Cognito 콘솔의 앱 클라이언트 허용 콜백/로그아웃 URL에 위 두 URL을 **직접** 추가하세요.
> 확인:
> ```bash
> aws cognito-idp describe-user-pool-client \
>   --user-pool-id <POOL_ID> --client-id 68mlrdhc5rjkjm6nsacqg429sj \
>   --query 'UserPoolClient.{cb:CallbackURLs,lo:LogoutURLs}'
> ```

### 3) 프론트 빌드 + 서울 S3 업로드 + 무효화
```bash
./deploy/release-seoul.sh
```
- Cognito redirect/logout만 새 도메인으로 바꿔 빌드(빌드 후 원복).
- API base URL은 기존 미국 백엔드 유지.
- 해시 자산은 1년 immutable, `index.html` 은 no-cache로 업로드 후 `/*` 무효화.

### 4) 검증
```bash
source deploy/.seoul-cdn.env
curl -I "https://$SEOUL_CF_DOMAIN/"            # 200, content-type text/html
curl -sI "https://$SEOUL_CF_DOMAIN/some/spa/route" | head -1   # SPA fallback → 200
```
브라우저로 `https://$SEOUL_CF_DOMAIN/` 접속 →
- 로그인/로그아웃(Cognito 콜백) 정상 동작
- AI 일정(에이전트) 기능 정상 호출
- 기존 미국 도메인(`d3nuef0zacpyj.cloudfront.net`) 접속자는 영향 없음

---

## 롤백 / 정리
- 프론트만 되돌리려면 이전 빌드로 `release-seoul.sh` 재실행.
- 서울 배포 전체 제거:
  ```bash
  source deploy/.seoul-cdn.env
  aws cloudfront get-distribution-config --id "$SEOUL_DISTRIBUTION_ID"   # ETag 확인
  # disable(Enabled:false) 후 distribution-deployed 대기 → delete-distribution
  aws s3 rm "s3://$SEOUL_BUCKET" --recursive
  aws s3api delete-bucket --bucket "$SEOUL_BUCKET"
  ```
- 백엔드 `parameters/dev.yaml` 에서 추가한 도메인 항목 제거 후 `sam deploy` 재실행.

## 멱등성
세 스크립트는 반복 실행에 안전합니다.
- `provision`은 기존 버킷/OAC를 재사용하고, CloudFront 배포도 **중복 생성하지 않습니다**:
  `.seoul-cdn.env`의 `SEOUL_DISTRIBUTION_ID`가 살아 있으면 그걸 재사용하고,
  없으면 이 버킷을 오리진으로 쓰는 기존 배포를 찾아 재사용합니다. 둘 다 없을 때만 새로 만듭니다.
  버킷 정책은 이 단일 배포 ARN만 허용하므로(버킷 전용), 재실행해도 orphan 배포나 권한 상실이 없습니다.
- `configure-new-domain.sh`는 `dev.yaml`에 멱등 추가하고, `.seoul-cdn.env`의 `SEOUL_CF_DOMAIN`도
  append가 아니라 **upsert**(키 중복 없음)로 갱신합니다.
- 만약 의도적으로 **새 도메인의 배포를 따로** 만들고 싶다면, 다른 `SEOUL_BUCKET=` 값으로
  `provision`을 실행하세요(버킷이 다르면 별도 배포가 생성됩니다).
