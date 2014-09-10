node-ipcalc
===========

<h2>What is is:</h2>
<p>node-ipcalc (ipcalc) is a node.js implementation of the popular *nix package ipcalc.</p>

<h2>Usage:</h2>
```shell
ipcalc [-n | --hosts] [IPv4 address] [cidr prefix | submask]
```

<h2>Example:</h2>
```shell
eric@crunchbang ~/sbdmn/node-ipcalc $ node ipcalc.js 192.168.1.1 24
Address:     192.168.1.1
Netmask:     255.255.255.0 = 24
Wildcard:    0.0.0.255
Class:       Class C
-->
Network:     192.168.1.0
NetMin:      192.168.1.1
NetMax:      192.168.1.254
Broadcast:   192.168.1.255
Subnets:     256
Hosts/Net:   254
eric@crunchbang ~/sbdmn/node-ipcalc $ node ipcalc.js 192.168.1.1 255.255.255.0
Address:     192.168.1.1
Netmask:     255.255.255.0 = 24
Wildcard:    0.0.0.255
Class:       Class C
-->
Network:     192.168.1.0
NetMin:      192.168.1.1
NetMax:      192.168.1.254
Broadcast:   192.168.1.255
Subnets:     256
Hosts/Net:   254
eric@crunchbang ~/sbdmn/node-ipcalc $ node ipcalc.js -n 192.168.1.1 250
Address:     192.168.1.1
Netmask:     255.255.255.0 = 24
Wildcard:    0.0.0.255
Class:       Class C
-->
Network:     192.168.1.0
NetMin:      192.168.1.1
NetMax:      192.168.1.254
Broadcast:   192.168.1.255
Subnets:     256
Hosts/Net:   254
```