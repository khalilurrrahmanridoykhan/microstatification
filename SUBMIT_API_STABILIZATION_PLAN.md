# Submit API Stabilization Plan

## Problem Summary

The server is timing out because submit traffic is too high and is competing with heavy read endpoints.

Observed patterns:

- Very frequent `POST /api/forms/1079/submit/`
- Repeated heavy endpoints in parallel (example: `/api/get-templates-bulk/`, `/api/get-template/113/`)
- Worker saturation leading to timeout/unreachable behavior

## Goal

Keep submit API fast and reliable under heavy load while protecting dashboard and other APIs.

## Priority Plan

### 1) Isolate submit traffic (highest priority)

- Run submit/OpenRosa endpoints on dedicated workers or dedicated service
- Keep dashboard/report APIs on separate workers
- Prevent one traffic type from starving the other

### 2) Make submit processing asynchronous

- Submit endpoint should quickly accept + enqueue
- Process expensive logic in background workers
- Return fast response to client

### 3) Fix submission data model

- Stop appending all submissions into one growing JSON blob
- Store each submission as its own row/document
- Improve write latency and avoid large row rewrites

### 4) Add rate limiting and idempotency

- Add per-device/user/form rate limits
- Add idempotency key (`instanceID`) to ignore duplicates
- Reduce retry storms and accidental floods

### 5) Reduce heavy read pressure

- Cache heavy template responses
- Avoid repeated full payload fetches per client action
- Add pagination/chunking for very large responses

### 6) Infra tuning (short-term relief, not final fix)

- Increase gunicorn worker capacity
- Review timeout settings
- Add autoscaling if available

## Notes

- `401` entries in logs are authentication/session issues and not the main timeout root cause.
- Real long-term fix is architecture + data model + queueing, not only increasing timeout/workers.

## Success Criteria

- Submit requests stay low-latency under peak traffic
- No timeout spikes during high submit volume
- Dashboard API latency remains stable while submits are heavy
- Duplicate submissions are not stored multiple times

