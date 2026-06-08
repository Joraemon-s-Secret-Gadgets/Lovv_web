# SKN_3rd_PJ Discord Reminder Bot

This project uses a GitHub Actions schedule to send a weekday progress reminder message to the Discord channel `SKN_3rd_PJ`.

The Discord webhook display name is `Notion 알림봇`.

## Schedule

All cron schedules are stored in UTC because GitHub Actions scheduled workflows run on UTC time.

| KST time | UTC cron | Weekdays | Message |
| --- | --- | --- | --- |
| 17:00 | `0 8 * * 1-5` | Monday-Friday | `오후 5시입니다. 오늘 각자 진행상황을 팀 Notion에 업로드해주세요.` |

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
4. Confirm the message appears in `SKN_3rd_PJ`.
