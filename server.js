import { serve } from "https://deno.land/std@0.151.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.151.0/http/file_server.ts";

serve(async (req) => {
  const pathname = new URL(req.url).pathname;
  console.log(pathname);

  if (req.method === "GET" && pathname === "/welcome-message") {
    return new Response("I have a pen.");
  }
  if (req.method === "POST" && pathname === "/welcome-message") {
    const requestJson = await req.json();
    const nextWord = requestJson.nextWord;
    console.log(nextWord);
    return new Response(nextWord, { status: 200 });
  }


  return serveDir(req, {
    fsRoot: "public",
    urlRoot: "",
    showDirListing: true,
    enableCors: true,
  });
});
