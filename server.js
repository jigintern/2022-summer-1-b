import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.138.0/http/file_server.ts";
import * as postgres from "https://deno.land/x/postgres@v0.14.0/mod.ts";
import { decode } from "https://deno.land/std@0.152.0/encoding/base64.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// 変数宣言
let formJson = JSON.stringify({});

// 接続確認用
console.log("Listening on http://localhost:8000");

// データベースに接続するためのURL?
const databaseUrl = "postgres://postgres:jigintern2022@db.tderfuecifzjrpfwsplc.supabase.co:6543/postgres";

// 接続
const pool = new postgres.Pool(databaseUrl, 3, true);

const client = createClient(
  'https://tderfuecifzjrpfwsplc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZXJmdWVjaWZ6anJwZndzcGxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjA2MTA4MDgsImV4cCI6MTk3NjE4NjgwOH0.lP8Fxlyofo36Lfki_jsdejFZyPI-H3F4XOPXo8dABVw'
)

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
          const id = 1;

          // 入力必須が空の場合は400を返す
          if (lat.length < 1 || long.length < 1 || photo.length < 1 || date.length < 1) {
            return new Response("Bad Request", { status: 400 });
          }

          await connection.queryObject`
            INSERT INTO posts VALUES (${id},${user_id}, ${lat}, ${long}, ${photo}, ${date});
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

  if(pathName === "/posts/image" && req.method === 'POST'){
    
    const json = await req.json();


    const get_data = await client.from('posts').select("id");
    console.log(get_data.data.length);

    //画像をsupabasenに送信
    const buffer = decode(json.file.replace(/^.*,/, ''));
    // console.log(json.file.replace(/^.*,/, ''))
    const file = new File([buffer], 'test.jpeg', { type: 'image/jpeg' });
    const { data, e } = await client.storage.from("hogehoge").upload('test.jpeg', file, { contentType: 'image/jpeg' });

    return new Response("ok");
  }

  return serveDir(req, {
    fsRoot: "public",
    urlRoot: "",
    showDirListing: true,
    enableCors: true
  });
}).then(r => {});