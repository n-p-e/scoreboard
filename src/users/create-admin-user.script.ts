import { Uuid25 } from "uuid25"
import { db } from "~/db/connection"
import { rolesTable } from "~/db/schema"
import { UserLoginZ } from "~/users/users-schema"
import { createUser } from "~/users/users-store"

async function createAdminUser() {
  return db.transaction(async (tx) => {
    const user = await createUser(
      UserLoginZ.parse({
        username: "admin",
        password: "init-admin-pw",
      }),
      tx
    )

    await tx.insert(rolesTable).values({
      user_id: Uuid25.parse(user.uid).toHyphenated(),
      role: "admin",
    })
  })
}

async function main() {
  await createAdminUser()
}

main()
