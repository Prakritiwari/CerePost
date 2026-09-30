import { db } from "@/server/db";

export const POST = async (req: Request) => {
    const { data } = await req.json()
    let emailAddress = data.email_addresses?.[0]?.email_address;

    if (!emailAddress) {
        emailAddress = `${data.id}@yourapp.local`;
    }

    const firstName = data.first_name;
    const lastName = data.last_name;
    const imageUrl = data.image_url;
    const id = data.id;

    await db.user.create({
        data: {
            id: id,
            emailAddress: emailAddress,
            firstName: firstName,
            lastName: lastName,
            imageUrl: imageUrl,

        }
    })

    console.log("user created")


    console.log("Clerk data recieved ", data);
    return new Response("Webhook recieved ", { status: 200 });

}