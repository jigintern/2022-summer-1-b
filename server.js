import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.138.0/http/file_server.ts";
import * as postgres from "https://deno.land/x/postgres@v0.14.0/mod.ts";

// 変数宣言
let formJson = JSON.stringify({});

// 接続確認用
console.log("Listening on http://localhost:8000");

// データベースに接続するためのURL?
const databaseUrl = "postgres://postgres:jigintern2022@db.tderfuecifzjrpfwsplc.supabase.co:6543/postgres";

// 接続
const pool = new postgres.Pool(databaseUrl, 3, true);

serve(async (req) => {
  const pathName = new URL(req.url).pathname;

  /*
    if (req.method === "GET" && pathName === "/posts") {
      return new Response(formJson, {
        headers: { "Content-Type": "application/json" }
      });
    }


    if (req.method === "POST" && pathName === "/posts") {
      const requestJson = await req.json();
      const userName = requestJson.userName;
      const latitude = requestJson.latitude;
      const longitude = requestJson.longitude;
      const photo = requestJson.photo;

      const result = JSON.stringify({userName, latitude, longitude, photo});

      console.log("[POSTED]");
      console.log("result: " + result);

      formJson = result;
      return new Response(result);
    }
     */

  if (pathName === "/posts") {
    const connection = await pool.connect();

    try {
      switch (req.method) {
        case "GET": {
          const result = await connection.queryObject`
                    SELECT * FROM posts
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

          // 入力必須が空の場合は400を返す
          if (lat.length < 1 || long.length < 1 || photo.length < 1 || date.length < 1) {
            return new Response("Bad Request", { status: 400 });
          }

          await connection.queryObject`
            INSERT INTO posts VALUES (${user_id}, ${lat}, ${long}, ${photo}, ${date});
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
  }

  return serveDir(req, {
    fsRoot: "public",
    urlRoot: "",
    showDirListing: true,
    enableCors: true
  });
}).then(r => {});