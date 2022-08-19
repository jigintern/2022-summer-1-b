import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.138.0/http/file_server.ts";
import * as postgres from "https://deno.land/x/postgres@v0.14.0/mod.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { decode } from "https://deno.land/std@0.152.0/encoding/base64.ts";
import { v4 } from "https://deno.land/std@0.151.0/uuid/mod.ts";

// 変数宣言
let formJson = JSON.stringify({});

// 接続確認用
console.log("Listening on http://localhost:8000");

// supabase
const SUPABASE_URL = "https://tderfuecifzjrpfwsplc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZXJmdWVjaWZ6anJwZndzcGxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjA2MTA4MDgsImV4cCI6MTk3NjE4NjgwOH0.lP8Fxlyofo36Lfki_jsdejFZyPI-H3F4XOPXo8dABVw";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ランダムなUUIDの生成
function randomUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(a) {
    let r = (new Date().getTime() + Math.random() * 16)%16 | 0, v = a === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

let uuid = "";

serve(async (req) => {
  const pathName = new URL(req.url).pathname;

  // 自動販売機の情報の GET/POST
  if (pathName === "/posts") {
    // データベースに接続するためのURL?
    const databaseUrl = "postgres://postgres:jigintern2022@db.tderfuecifzjrpfwsplc.supabase.co:6543/postgres";
    // 接続
    const pool = new postgres.Pool(databaseUrl, 400, true);
    const connection = await pool.connect();

    try {
      switch (req.method) {
        case "GET": {
          const result = await connection.queryObject`SELECT * FROM posts`;

          const body = JSON.stringify(result.rows, null, 4);

          return new Response(body, {
            headers: { "Content-Type": "application/json" }
          });
        }

        case "POST": {
          const json = await req.json();
          const id = json.id;
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
            INSERT INTO posts VALUES (${id}, ${user_id}, ${lat}, ${long}, ${photo}, ${date});
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

  // データベースに写真をアップロードする POST
  if(pathName === "/posts/image" && req.method === 'POST'){
    const json = await req.json();

    //画像をsupabaseに送信
    const tmp = json.file.split(";")[0];
    const extension = tmp.split("/")[1];
    const buffer = decode(json.file.replace(/^.*,/, ''));
    const fileName = uuid + "." + extension;

    console.log(fileName);

    const file = new File([buffer], fileName, { type: "image/" + extension });
    const { data, e } = await supabase.storage.from("hogehoge").upload(fileName, file, { contentType: "image/" + extension });

    return new Response("https://tderfuecifzjrpfwsplc.supabase.co/storage/v1/object/public/hogehoge/" + fileName, { status: 200 });
  }

  // サインアップの POST
  if (pathName === "/signup") {
    if (req.method === "POST") {
      const json = await req.json();
      const email = json.email;
      const user_id = json.user_id;
      const password = json.password;

      const { user, session, error } = await supabase.auth.signUp({
        email: email,
        password: password
      },
  {
        data: {
          user_id: user_id
        }
      });

      const response = JSON.stringify({ user, session, error });
      return new Response(response);
    }
  }

  // サインインの POST
  if (pathName === "/signin") {
    if (req.method === "POST") {
      const json = await req.json();
      const email = json.email;
      const password = json.password;

      const { user, session, error } = await supabase.auth.signIn({
        email: email,
        password: password
      });

      const response = JSON.stringify({ user, session, error });
      return new Response(response);
    }
  }

  // サインアウトの POST
  if (pathName === "/signout") {
    if (req.method === "POST") {
      const { error } = await supabase.auth.signOut();
      
      const response = JSON.stringify({ error });
      return new Response(response);
    }
  }

  // UUIDを生成する
  if (pathName === "/" || pathName === "/index.html") {
    uuid = v4.generate();
  }

  return serveDir(req, {
    fsRoot: "public",
    urlRoot: "",
    showDirListing: true,
    enableCors: true
  });
}).then(r => {});