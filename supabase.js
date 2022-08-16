import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import * as postgres from "https://deno.land/x/postgres@v0.14.0/mod.ts";

// Get the connection string from the environment variable "DATABASE_URL"
const databaseUrl = "postgres://postgres:jigintern2022@db.tderfuecifzjrpfwsplc.supabase.co:6543/postgres";
console.log(databaseUrl);

// Create a database pool with three connections that are lazily established
const pool = new postgres.Pool(databaseUrl, 3, true);

serve(async (req) => {
    const url = new URL(req.url);

    if (url.pathname !== "/register") {
        return new Response("Not Found", { status: 404 });
    }

    const connection = await pool.connect();

    try {
        switch (req.method) {
            case "GET": {
                const result = await connection.queryObject`
                    SELECT * FROM register
                `;

                const body = JSON.stringify(result.rows, null, 5);

                return new Response(body, {
                    headers: { "Content-Type": "application/json" }
                });
            }

            case "POST": {
                const json = await req.json();
                const user_id = json.user_id;
                const lat = json.lat;
                const long = json.long;
                const photo = json.photo;
                const date = json.date;

                if (typeof user_id !== "string" || user_id.length > 256) {
                    return new Response("Bad Request", { status: 400 });
                }

                await connection.queryObject`
                    INSERT INTO register VALUES (${user_id}, ${lat}, ${long}, ${photo}, ${date});
                `;

                return new Response("Created", { status: 201 });
            }

            default:
                return new Response("Method Not Allowed", { status: 405 });
        }
    } catch (err) {
        console.error(err);
        return new Response(`Internal Server Error\n\n${err.message}`, { status: 500 });
    } finally {
        connection.release();
    }
});