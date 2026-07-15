# API Reference — LogicLens Drive (\DAM)

Base URL (local): `http://localhost:3000`

Authentication: send `Authorization: Bearer <accessToken>` on protected routes. Access tokens expire after 15 minutes; use `/auth/refresh` to obtain a new pair without re-authenticating.

---

## Auth

| Method | Path | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/auth/register` | Admin only | `{ email, password }` | Create a new user account |
| POST | `/auth/login` | None | `{ email, password }` | Returns `{ accessToken, refreshToken }` |
| POST | `/auth/refresh` | None | `{ refreshToken }` | Rotates and returns a new token pair |
| POST | `/auth/logout` | None | `{ refreshToken }` | Revokes the given refresh token |

---

## Products

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/products` | None | List all products |
| GET | `/products/:id` | None | Get one product |
| GET | `/products/:id/thumbnail` | None | Get thumbnail or product(Image) |
| GET | `/products/:id/files` | None | List synced files for a product (excludes trashed) |
| POST | `/products` | Required | Create a product — `{ name, description?, driveFolderId }` |
| POST | `/products/:id/sync-hierarchy` | Required | Sync hierarchy of files |
| POST | `/products/upload` | Required | Upload files to google drive| 
| PATCH | `/products/:id` | Required | Update a product |
| DELETE | `/products/:id` | Required | Hard-delete a product and its file records |
| POST | `/products/:id/sync` | Required | Recursively sync files from the linked Drive folder |

---

## Files

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/files/search` | Optional* | Query params: `query`, `category`, `tag`, `productId` |
| GET | `/files/:id/preview` | Optional* | Streams file content inline (`Content-Disposition: inline`) |
| GET | `/files/:id/download` | Optional* | Streams file content as attachment |
| GET | `/files/:id/thumbnail` | None | Get thumbnail of current file if it is image |
| GET | `/files/:id/preview-url` | None | Go to google preview of file |
| PATCH | `/files/:id` | Required | Update `title`, `description`, `remarks`, `visibility`, `categoryId`, `tagIds[]` |
| DELETE | `/files/:id` | Required | Soft-delete (moves to Recycle Bin) |
| POST | `/files/:id/restore` | Required | Restore from Recycle Bin |
| GET | `/files/trash` | Required | List soft-deleted files |

*Optional auth: guests see only `PUBLIC` visibility files; authenticated users see all.

---

## Categories

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/categories` | None | List all categories |
| POST | `/categories` | Required | Create — `{ name }` |
| PATCH | `/categories/:id` | Required | Rename |
| DELETE | `/categories/:id` | Required | Delete (fails if files still reference it) |

## Tags

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/tags` | None | List all tags |
| POST | `/tags` | Required | Create — `{ name }` |
| DELETE | `/tags/:id` | Required | Delete |

---

## Error format

All errors follow NestJS's standard shape:
```json
{
  "statusCode": 404,
  "message": "Product with id ... not found",
  "error": "Not Found"
}
```
Validation errors return an array of messages under `message`.