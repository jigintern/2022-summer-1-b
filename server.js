import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.138.0/http/file_server.ts";
import * as postgres from "https://deno.land/x/postgres@v0.14.0/mod.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// 変数宣言
let formJson = JSON.stringify({});

// 接続確認用
console.log("Listening on http://localhost:8000");

// supabase
const SUPABASE_URL = "https://tderfuecifzjrpfwsplc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZXJmdWVjaWZ6anJwZndzcGxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjA2MTA4MDgsImV4cCI6MTk3NjE4NjgwOH0.lP8Fxlyofo36Lfki_jsdejFZyPI-H3F4XOPXo8dABVw";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

  // 自動販売機の情報の GET/POST
  if (pathName === "/posts") {
    // データベースに接続するためのURL?
    const databaseUrl = "postgres://postgres:jigintern2022@db.tderfuecifzjrpfwsplc.supabase.co:6543/postgres";
    // 接続
    const pool = new postgres.Pool(databaseUrl, 3, true);
    const connection = await pool.connect();

    try {
      switch (req.method) {
        case "GET": {
          const result = await connection.queryObject`
                    SELECT * FROM posts
                `;

          const body = JSON.stringify(result.rows, null, 4);

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

  return serveDir(req, {
    fsRoot: "public",
    urlRoot: "",
    showDirListing: true,
    enableCors: true
  });
}).then(r => {});