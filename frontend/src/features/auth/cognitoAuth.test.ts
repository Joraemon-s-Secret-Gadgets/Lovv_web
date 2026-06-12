import { describe, expect, it, vi } from 'vitest'
import { requestCognitoToken } from './cognitoAuth'

describe('Cognito Hosted UI token client', () => {
  it('exchanges an authorization code through the public Cognito token endpoint without client secrets', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: 'cognito-access-token',
        id_token: 'cognito-id-token',
        refresh_token: 'cognito-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
      }),
    })

    const result = await requestCognitoToken(
      {
        code: 'cognito-auth-code',
        redirectUri: 'https://lovv.example/auth/callback',
        codeVerifier: 'cognito-pkce-verifier',
      },
      {
        hostedUiBaseUrl: 'https://lovv-test.auth.ap-northeast-2.amazoncognito.com/',
        clientId: 'lovv-cognito-client-id',
        fetchImpl,
      },
    )

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://lovv-test.auth.ap-northeast-2.amazoncognito.com/oauth2/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=authorization_code&client_id=lovv-cognito-client-id&code=cognito-auth-code&redirect_uri=https%3A%2F%2Flovv.example%2Fauth%2Fcallback&code_verifier=cognito-pkce-verifier',
      },
    )
    expect(fetchImpl.mock.calls[0][1].body).not.toContain('client_secret')
    expect(result).toEqual({
      accessToken: 'cognito-access-token',
      idToken: 'cognito-id-token',
      refreshToken: 'cognito-refresh-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
    })
  })
})
