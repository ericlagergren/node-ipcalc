node-ipcalc
===========
[![Build Status](https://travis-ci.org/EricLagerg/node-ipcalc.svg)](https://travis-ci.org/EricLagerg/node-ipcalc)

<h2>What is is:</h2>
<p>node-ipcalc (ipcalc) is a node.js implementation of the popular *nix package ipcalc.</p>

<h2>Usage:</h2>
```shell
usage: node ipcalc [-h] [-n | --host] <IPv4 Address>[[/]prefix] [netmask] [hosts OPT]
```

<h2>Example:</h2>
```shell
eric@crunchbang ~/github-repos/node-ipcalc $ node ipcalc.js 192.168.1.1/24
IPv4 address entered
--------------------

Address:                - 192.168.1.1
Address (hex):          - 0xC0A80101
Address (decimal):      - 3232235777
Netmask:                - 255.255.255.0 = 24
Netmask (hex):          - 0xFFFFFF00
Netmask (decimal):      - 4294967040
Wildcard:               - 0.0.0.255
Class:                  - Class C
Network:                - 192.168.1.0
NetMin:                 - 192.168.1.1
NetMax:                 - 192.168.1.254
Broadcast:              - 192.168.1.255
Subnets:                - 256
Hosts/Net:              - 254

-
eric@crunchbang ~/github-repos/node-ipcalc $ node ipcalc.js 192.168.1.1 255.255.255.0
IPv4 address entered
--------------------

Address:                - 192.168.1.1
Address (hex):          - 0xC0A80101
Address (decimal):      - 3232235777
Netmask:                - 255.255.255.0 = 24
Netmask (hex):          - 0xFFFFFF00
Netmask (decimal):      - 4294967040
Wildcard:               - 0.0.0.255
Class:                  - Class C
Network:                - 192.168.1.0
NetMin:                 - 192.168.1.1
NetMax:                 - 192.168.1.254
Broadcast:              - 192.168.1.255
Subnets:                - 256
Hosts/Net:              - 254

-
eric@crunchbang ~/github-repos/node-ipcalc $ node ipcalc.js -n 192.168.1.1 250
IPv4 address entered
--------------------

Address:                - 192.168.1.1
Address (hex):          - 0xC0A80101
Address (decimal):      - 3232235777
Netmask:                - 255.255.255.0 = 24
Netmask (hex):          - 0xFFFFFF00
Netmask (decimal):      - 4294967040
Wildcard:               - 0.0.0.255
Class:                  - Class C
Network:                - 192.168.1.0
NetMin:                 - 192.168.1.1
NetMax:                 - 192.168.1.254
Broadcast:              - 192.168.1.255
Subnets:                - 256
Hosts/Net:              - 254

-

```
