export async function handleHTML(request) {
    const currentUrl = new URL(request.url);
    const uuid = crypto.randomUUID();
    const fullUrl = `${currentUrl.origin}/${uuid}`;

    const html = `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>JRebel License Server</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #f0f0f0;
          }
          .container {
              text-align: center;
              padding: 40px;
              background-color: white;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              max-width: 600px;
              width: 100%;
          }
          h1 {
              color: #333;
              margin-bottom: 20px;
          }
          .github-link {
              display: inline-block;
              margin-top: 20px;
              margin-bottom: 20px;
          }
          .github-icon {
              width: 32px;
              height: 32px;
              vertical-align: middle;
          }

          .list{
            text-align: left;
             display: flex;
            flex-direction: column;
          }

          .list .item{
            margin-top: 10px;
            display: flex;
            align-items: center;
          }

          .list .item .label{
            margin-right: 10px;
          }

          .current-url {
              background-color: #f0f0f0;
              padding: 10px;
              border-radius: 4px;
              font-family: monospace;
              word-break: break-all;
          }

          .email{
            color: #1d5874;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <h1>JRebel License Server</h1>
          <a href="https://github.com/jrt324/jrebel-license-server" class="github-link" target="_blank" rel="noopener noreferrer">
              <svg class="github-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              项目仓库
          </a>
          <div class="list">
            <div class="item">
                <a class="label">激活地址:</a>
                <div class="current-url">${fullUrl}</div>
            </div>
            

            <div class="item">
                <a class="label">激活邮箱:</a>
                <a class="email">任意邮箱</a>
            </div>
            
          </div>
         
      </div>
  </body>
  </html>
    `;

    return new Response(html, {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
    });
}
