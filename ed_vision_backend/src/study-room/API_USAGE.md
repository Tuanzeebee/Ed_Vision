# Study Room API

## REST

- `POST /study-rooms`
  - Auth: `Bearer dev-token-{accountId}` or existing access token
  - Body:
    ```json
    {
      "title": "Night Focus Room",
      "roomMode": "video",
      "password": "optional",
      "coverType": "image",
      "coverUrl": "https://example.com/cover.jpg",
      "isPublic": true,
      "maxParticipants": 12
    }
    ```

- `GET /study-rooms`
  - Query: `search`, `roomMode`, `isPublic`, `page`, `limit`

- `POST /study-rooms/:roomId/access`
  - Body:
    ```json
    {
      "password": "optional"
    }
    ```

- `GET /study-rooms/:roomId`

- `GET /study-rooms/me/stats`

- `GET /study-rooms/leaderboard?limit=10`

## WebSocket

- Namespace: `/study-rooms`
- Auth:
  - `auth: { "token": "dev-token-123" }`
  - or `Authorization: Bearer dev-token-123`

### Client events

- `room.join`
  - Payload:
    ```json
    {
      "roomId": 5,
      "password": "optional",
      "micOn": false,
      "cameraOn": true
    }
    ```

- `room.leave`
  - Payload:
    ```json
    {
      "roomId": 5
    }
    ```

- `room.heartbeat`
  - Payload:
    ```json
    {
      "roomIds": [5]
    }
    ```

- `room.participant.update`
  - Payload:
    ```json
    {
      "roomId": 5,
      "micOn": true,
      "cameraOn": false,
      "handRaised": false
    }
    ```

- `room.moderation.mute`
- `room.moderation.kick`
- `room.moderation.unban`
  - Payload:
    ```json
    {
      "roomId": 5,
      "targetAccountId": 42
    }
    ```

- `room.moderation.ban`
  - Payload:
    ```json
    {
      "roomId": 5,
      "targetAccountId": 42,
      "durationMinutes": 60
    }
    ```

### Server events

- `room.connected`
- `room.joined`
- `room.left`
- `room.participant.joined`
- `room.participant.updated`
- `room.participant.left`
- `room.participant.muted`
- `room.participant.kicked`
- `room.participant.banned`
- `room.participant.unbanned`
- `room.error`

## Notes

- LiveKit remains responsible for camera/microphone media streams.
- Redis is used for presence, socket membership, and mic/camera state. If Redis is unavailable the backend falls back to in-memory state for local development only.
- Prisma is used only for durable room history, actions, bans, sessions, streaks, stats, and leaderboard data.
