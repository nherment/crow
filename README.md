
# Crow

Crow is a node.js based URL checker that is automation friendly

It prints results in a table in your console.
Crow will exit with a non-zero exit code if one of the tests failed.

```
  ~ npm install -g crow
  ~ crow remotes.json
  ┌──────────────────────────────┬────────┬─────────────────────────────────┬────────┐
  │ URI                          │ Method │ Status                          │ Delay  │
  ├──────────────────────────────┼────────┼─────────────────────────────────┼────────┤
  │ https://arkhaios.net:443/    │ GET    │ UNABLE_TO_VERIFY_LEAF_SIGNATURE │ 312ms  │
  ├──────────────────────────────┼────────┼─────────────────────────────────┼────────┤
  │ https://elipsis.io:443/login │ POST   │ Error: HTTP 403                 │ 698ms  │
  ├──────────────────────────────┼────────┼─────────────────────────────────┼────────┤
  │ https://google.com:443/      │ GET    │ ok                              │ 2624ms │
  ├──────────────────────────────┼────────┼─────────────────────────────────┼────────┤
  │ http://google.com:80/        │ GET    │ ok                              │ 1575ms │
  ├──────────────────────────────┼────────┼─────────────────────────────────┼────────┤
  │ http://nowhere:80/           │ GET    │ getaddrinfo ENOTFOUND           │ 33ms   │
  └──────────────────────────────┴────────┴─────────────────────────────────┴────────┘
```

The URLs are alphabetically ordered by domain, port and path

## Config file

File ```remotes.json```


```
  [
    {
      "protocol": "https",
      "domain": "google.com",
      "port": 443,
      "path": "/"
    }, {
      "protocol": "http",
      "domain": "google.com",
      "port": 80,
      "path": "/"
    }, {
      "protocol": "https",
      "domain": "arkhaios.net",
      "port": 443,
      "path": "/"
    }, {
      "protocol": "http",
      "domain": "nowhere",
      "port": 80,
      "path": "/"
    }, {
      "protocol": "https",
      "domain": "elipsis.io",
      "port": 443,
      "path": "/login",
      "method": "POST",
      "headers": {
        "Content-Type": "application/json"
      },
      "body": {
        "email": "hello@elipsis.io",
        "password": "123456"
      }
    }
  ]
```
