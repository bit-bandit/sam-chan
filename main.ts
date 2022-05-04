import {
  Application,
  Router,
  send,
  Status,
} from "https://deno.land/x/oak/mod.ts";

// URL for backend
let api_url: string = "http://localhost:8000";

// URL for frontend
let app_url: string = "http://localhost:9001";

const style = `
body {
  display: block;
  overflow: auto;
  background-color: antiquewhite;
  margin: 0;
  padding: 1em;
}

.post {
  
}

.reply {
  direction:ltr;
  margin: 15px;
  padding: 5px;
  background-color: aliceblue;
}

img {
  max-width: 20em; /* Fuck you, this is how we're doing it. */
}

.catalog {
  display: grid;
  grid-template-columns: repeat(5, 6fr);
  gap: 10px;
  grid-auto-rows: 100px;
  width: 120em;

}

.catalog .post {
  direction:ltr;
  margin: 0;
}

.catalog img {
   width:15em;
   height:15em;
   object-fit:scale-down;
}

body::-webkit-scrollbar {
  width: 10px;
  height: 8px;
  background-color: antiquewhite;
}

body::-webkit-scrollbar-thumb {
  padding: 20px;
  background: #99994c;
}
`;

interface Reply {
  "id": number | string;
  "posted": string;
  "tripcode": string | null;
  "name": string | null;
  "content": string | null;
  "attachments": string | null;
  "admin"?: boolean;
}

interface Post {
  "id": number | string;
  "posted": string;
  "tripcode": string | null;
  "name": string | null;
  "title": string | null;
  "content": string | null;
  "attachments": string;
  "admin"?: boolean;
  "replies": Reply[];
}

async function genpost(x: Post, board: string): Promise<string> {
  let res: string = `<html>\n<title></title>\n<style>${style}</style>\n<body>`;
  res += `<div class="post" id="${x.id}">`;
  res += `<div class="postinfo">`;
  res += `<b>${x.name} ${x.posted}</b>`;

  if (x.tripcode != null) {
    res += `<b>${x.tripcode}</b>`;
  }

  res += `</div>`;

  res += `<div class = "post-img">`;
  res +=
    `<a href="${api_url}${x.attachments}"><img src="${api_url}${x.attachments}"></a>`;
  res += `</div>`;

  res += `<p>\n${x.content}\n</p>`;

  res += `</div>`;

  x.replies.map(async function (y: any) {
    let str: string = "";
    str += `<div class="reply" id="${y.id}">`;
    str += `<div class="replyinfo">`;
    str += `<b>${y.id} - ${y.name} - ${y.posted} - </b>`;

    if (y.tripcode != null) {
      str += `<b>${y.tripcode}</b>`;
    }

    str += `</div>`;

    if (y.attachments) {
      str += `<div class = "reply-img">`;
      str +=
        `<a href="${api_url}${y.attachments}"><img src="${api_url}${y.attachments}"></a>`;
      str += `</div>`;
    }

    str += `<p>\n${y.content}\n</p>`;
    str += `</div>`;

    res += str;
  });

  res += '<h3 class="post"><b>Reply to this post:</b></h3>';

  res +=
    `<form method="POST" action="${api_url}/boards/${board}/${x.id}" id="usrsub" enctype="multipart/form-data" class="post">
<textarea rows="1" cols="50" name="name" form="usrsub" placeholder="Name">
</textarea><br>
<textarea rows="1" cols="50" name="trip" form="usrsub" placeholder="Tripcode">
</textarea>
<br>
<textarea rows="5" cols="50" name="content" form="usrsub" placeholder="Reply">
</textarea>
<br>
<input type="file" id="files" name="files" accept="image/png, image/jpeg">
<input type="submit" value="Submit reply">`;

  res += "</body>\n</html>";

  return res;
}

async function gencatalog(x: any, board: string): Promise<string> {
  let res: string = "";

  res += `<html>\n<title></title>\n<style>${style}</style>\n<body>`;
  res +=
    `<form method="POST" action="${api_url}/boards/${board}" id="usrsub" enctype="multipart/form-data" class="post">
<textarea rows="1" cols="50" name="title" form="usrsub" placeholder="Title">
</textarea><br>
<textarea rows="1" cols="50" name="name" form="usrsub" placeholder="Name">
</textarea><br>
<textarea rows="1" cols="50" name="trip" form="usrsub" placeholder="Tripcode">
</textarea><br>
<textarea rows="5" cols="50" name="content" form="usrsub" placeholder="Post">
</textarea>
<br>
<input type="file" id="files" name="files" accept="image/png, image/jpeg">
<input type="submit" value="Submit reply"></form>
<div class="catalog">
`;

  x.map(async function (y: any) {
    let str: string = "";
    str += `<div class="post">`;
    str +=
      `<a href="${app_url}/boards/${board}/${y.id}"><img src="${api_url}${y.attachments}"></a>`;
    str += `<p>R:<b>${y.replies}</b> I:<b>${parseInt(y.image_replies)}</b></p>`;

    if (y.title) str += `<h5>${y.title}</h5>`;

    str += `<p>\n${y.content}\n</p>`;
    str += `</div>\n`;

    res += str;
  });

  res += "</div>\n</body>\n</html>";

  return res;
}

// Actually send shit to the user - Because that's useful, right?
const app = new Application();

const routes = new Router()
  .get("/", async function (ctx) {
    ctx.response.redirect(`${app_url}/boards`);
  })
  .get("/boards", async function (ctx) {
    let res: string =
      `<html>\n<title></title>\n<style>${style}</style>\n<body>`;

    let fetched = await fetch(`${api_url}/`);
    let json = await fetched.json();

    json.map(async function (x: any) {
      res +=
        `<h3><a href="${app_url}/boards/${x.board}/">${x.board} - ${x.description}</a></h3>`;
    });

    res += "</body>\n</html>";

    ctx.response.body = res;
    ctx.response.type = "html";
  })
  .get("/boards/:board/:id", async function (ctx) {
    let fetched = await fetch(
      `${api_url}/boards/${ctx.params.board}/${ctx.params.id}`,
    );
    let json = await fetched.json();

    let res = await genpost(json, `${ctx.params.board}`);

    ctx.response.body = res;
    ctx.response.type = "html";
  })
  .get("/boards/:board/", async function (ctx) {
    let fetched = await fetch(`${api_url}/boards/${ctx.params.board}`);
    let json = await fetched.json();

    let res = await gencatalog(json, `${ctx.params.board}`);

    ctx.response.body = res;
    ctx.response.type = "html";
  });

app.use(routes.routes());
app.use(routes.allowedMethods());

app.addEventListener(
  "listen",
  (e) => console.log(`Listening on http://localhost:9001`),
);

await app.listen({ port: 9001 });
