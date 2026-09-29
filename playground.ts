import { db } from "./src/server/db";

await db.user.create({
    data: {
        emailAddress : "test@gmail.com",
        firstName: "Observer",
        lastName: "Human",

    }
})

console.log("Kabutar done");
