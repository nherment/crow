
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

## Options

### --help | -h

Displays usage information.

```
  usage:
      crow [options] <config_file.json>

  options:
      --no-progress      do not show progress
      --ipv4             adds a column to display "A" DNS records
```

### --no-progress

Disables the progress 'dots'.

When running, crow displays a single 'dot' ```.``` for each server reached. This option
disables the display of the progress 'dots'.

### --ipv4

Displays a column with the IPv4 address of the server.

```
  ~ crow remotes.json --ipv4
  ┌───────────────────────────────────┬────────┬─────────────────────────────────┬────────┬────────────────┐
  │ URI                               │ Method │ Status                          │ Delay  │ IP Address     │
  ├───────────────────────────────────┼────────┼─────────────────────────────────┼────────┼────────────────┤
  │ https://arkhaios.net/             │ GET    │ UNABLE_TO_VERIFY_LEAF_SIGNATURE │ 180ms  │ 144.76.221.102 │
  ├───────────────────────────────────┼────────┼─────────────────────────────────┼────────┼────────────────┤
  │ https://elipsis.io/               │ GET    │ ok                              │ 268ms  │ 144.76.221.102 │
  └───────────────────────────────────┴────────┴─────────────────────────────────┴────────┴────────────────┘
```

### --ipv6

Same as ```--ipv4``` but for IP v6 addresses.

## Changelog

### 0.2.1

- added progress feedback and the ability to disable it
- added ability to display a column containing the IP v4 address of the server ```--ipv4```
- added ability to display a column containing the IP v6 address of the server ```--ipv6```
- delays greater than 1000ms are displayed in bold red
- error statuses are displayed in bold red

