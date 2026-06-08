# SKN_3rd_PJ Discord Reminder Bot

This project uses a GitHub Actions schedule to send weekday reminder messages to the Discord channel `SKN_3rd_PJ`.

## Schedule

All cron schedules are stored in UTC because GitHub Actions scheduled workflows run on UTC time.

| KST time | UTC cron | Weekdays | Message |
| --- | --- | --- | --- |
| 09:00 | `0 0 * * 1-5` | Monday-Friday | `좋은 아침입니다. 오전 9시 출석 체크해주세요.` |
| 17:00 | `0 8 * * 1-5` | Monday-Friday | `오후 5시입니다. 오늘 각자 진행상황을 Discord 채널에 업로드해주세요.` |

## Required Secret

Create a Discord incoming webhook for the `SKN_3rd_PJ` channel, then save the webhook URL as a GitHub Actions repository secret:

```text
DISCORD_WEBHOOK_URL
```

Do not commit the real webhook URL to this repository, docs, issue comments, pull requests, or chat logs.

## Manual Test

After the secret is configured, run the workflow manually from GitHub Actions:

1. Open `Actions`.
2. Select `SKN_3rd_PJ Discord Reminders`.
3. Click `Run workflow`.
4. Choose `attendance` or `progress`.
5. Confirm the message appears in `SKN_3rd_PJ`.
