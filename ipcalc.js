#!/bin/env node

/*
Copyright 2014 Eric Lagergren

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

*/

"use strict";

var _AUTHOR_ = "Eric Lagergren <ericscottlagergren@gmail.com>";
var _BUGS_ = "https://github.com/EricLagerg/node-ipcalc/issues";
var _VERSION_ = "3.0.1";

var two = process.argv[2];
var three = process.argv[3];
var four = process.argv[4];

// Declare constants*
// Cannot use 'use strict' and 'const' at the same time right now
var THIRTY_TWO_BITS = 4294967295;
var MAX_BIT_VALUE = 32;
var MAX_BIT_BIN = 255;
var EXIT_SUCCESS = 0;
var EXIT_FAILURE = 1;

var submaskInput, ipInput, submask, base;

// Process args

var help = "usage: node ipcalc [-h] [-n | --host] <IPv4 Address> <submask> | <cidr prefix> [hosts OPT]\n\nnode ipcalc help:\n=================\npositional arguments:\n\tIPv4 Address\tValid IPv4 Address\n\n\tSubmask\t\tValid Submask in CIDR\n\t\t\tprefix or quad-dotted form\n\noptional arguments:\n\t-n, --host\tuse number of hosts to find network information\n\t-i, --info\tget author information\n\t-h, --help\tget this message\n\t-v, --version\tget version\n",
    version = _VERSION_ + "\n",
    author = 'Author: ' + _AUTHOR_ + "\nBugs: " + _BUGS_ + "\nVersion: " + _VERSION_ + "\n";

if (!two) {
    information(help);
    process.exit(EXIT_FAILURE);
} else if ("-h" === two || "--help" === two) {
    information(help);
    process.exit(EXIT_SUCCESS);
} else if ("-v" === two || "--version" === two) {
    information(version);
    process.exit(EXIT_SUCCESS);
} else if ("-i" === two || "--info" === two) {
    information(author);
    process.exit(EXIT_SUCCESS);
} else if ("-" === two.substr(0, 1) && "-n" !== two && "--host" !== two) {
    console.log(two.substr(0, 1));
    information(help);
    process.exit(EXIT_FAILURE);
}

function information(arg) {
    process.stdout.write(arg);
}

// ----------------- //
// Main computations //
// ----------------- //

submaskInput = three;
ipInput = two;

if (!three) {
    // If there's not process.argv[3] then the user's input must
    // be 'xxx.xxx.xxx.xxx/xx'
    var x = two.split('/');
    ipInput = x[0];
    base = x[1];
    submask = getSubmask(x[1]);

} else if ("-n" === two || "--host" === two || submaskInput > MAX_BIT_VALUE) {
    // If the submask is larger than 32 it's the number of required hosts
    // Also change around inputs because of the -n/--host flag
    submaskInput = +four;
    ipInput = three;
    base = getCidrFromHost(submaskInput);
    submask = getSubmask(base);

} else if (submaskInput <= MAX_BIT_VALUE) {
    // If the submask's input is <= 32 then it's in CIDR prefix format
    base = submaskInput;
    submask = getSubmask(parseInt(submaskInput, 10));

} else if (4 === submaskInput.split(".").length) {
    // If the submask can be split into four parts it's in quad-dotted
    // notation
    base = getCidr(submaskInput);
    submask = submaskInput;

}

// Convert base to int -- not necessary, but prevents JS from switching types
// which *should* increase speed
base = +base;

// Splits our inputs into arrays to use later
var ipInputArray = ipInput.split(".");
var submaskInputArray = submask.split(".");

function validate(item_to_val, item_name) {
    var itv_arr = item_to_val.split(".");
    // If the ip/submask isn't quad-dotted, it must be invalid
    // Or if it's an empty string it's also invalid
    if (4 !== itv_arr.length || "" === item_to_val) {
        throwError(item_name);
    }

    for (var j = 0; j < 4; j++) {
        var itv_int = +itv_arr[j];
        // If the specific element of the ip/submask can't be converted to
        // an integer without not equaling (using == not ===) the string
        // version, then it's invalid
        // 
        // If the integer element is < 0 or > 255 then it's invalid as well
        if (itv_int != itv_arr[j] || itv_int < 0 || itv_int > MAX_BIT_BIN) {
            throwError(item_name);
        }
        itv_arr[j] = itv_int;
    }
}

// Validate both submask and IP
validate(ipInput, "IP");
validate(submask, "Subnet Mask");

// Converts an IP/Submask into 32 bit int
function qdotToInt(ip) {
    var x = 0;

    x += +ip[3] << 24 >>> 0;
    x += +ip[2] << 16 >>> 0;
    x += +ip[1] << 8 >>> 0;
    x += +ip[0] >>> 0;

    return x;
}

// Reverses the previous function
function intToQdot(integer) {

    var arr = [0, 8, 16, 24];

    var x = arr.map(function(n) {
        //console.log(integer, n)
        return integer >> n & 0xFF;
    }).join('.');

    return x;
}

function getCidrFromHost(input) {
    // as long as the number of hosts isn't 0, find (log2(hosts)), round 
    // up, and subtract that from MAX_BIT_VALUE to find the correct CIDR
    return 0 !== input ? MAX_BIT_VALUE - Math.ceil(Math.log(input) / Math.log(2)) : 0;
}

function getSubmask(input) {
    var mask = -1 << (MAX_BIT_VALUE - input);
    return [mask >> 24 & MAX_BIT_BIN,
        mask >> 16 & MAX_BIT_BIN,
        mask >> 8 & MAX_BIT_BIN,
        mask & MAX_BIT_BIN
    ].join('.');
}

// Inverse of submask
function getWildcard(input) {
    var mask = ~ (-1 << (MAX_BIT_VALUE - input));
    return [mask >> 24 & MAX_BIT_BIN,
        mask >> 16 & MAX_BIT_BIN,
        mask >> 8 & MAX_BIT_BIN,
        mask & MAX_BIT_BIN
    ].join('.');
}

function getCidr(input) {

    var arr = input.split('.');

    // Similar to:
    // arr = [192.168.0.1]
    // x =  192 << 8 | 168
    // x += 168 << 8 | x
    // x +=   0 << 8 | x
    // x +=   1 << 8 | x
    // return x
    var x = arr.reduce(function(previousValue, currentValue) {
        return (previousValue << 8 | currentValue) >>> 0;
    });

    // https://github.com/mikolalysenko/bit-twiddle/blob/master/twiddle.js#L63
    // https://github.com/mikolalysenko/bit-twiddle/blob/master/LICENSE
    x -= (x >>> 1) & 0x55555555;
    x = (x & 0x33333333) + (x >>> 2 & 0x33333333);

    return ((x + (x >>> 4) & 0xF0F0F0F) * 0x1010101) >>> 24;
}

function fhosts(hv) {
    hv = hv || 0; // zero out hv
    if (hv >= 2) {
        hv = (Math.pow(2, (MAX_BIT_VALUE - hv))) - 2;
        // 2^(total bits - on bits) = off bits -2 because of nwork/bcast addrs
    }
    return hv;
}

function fsubnets(base) {
    var mod_base = base % 8;
    return mod_base ? Math.pow(2, mod_base) : Math.pow(2, 8);
}

function findClass(ip) {
    if (ip < 128) {
        return "Class A";
    }
    if (ip < 192) {
        return "Class B";
    }
    if (ip < 224) {
        return "Class C";
    }
    if (ip < 240) {
        return "Class D";
    }
    if (ip < 256) {
        return "Class E";
    }
    if (!ip || ip < 0 || 'undefined' === typeof ip) {
        throwError('IP');
    } else {
        throwError('IP');
    }
}

function networkAddress(ip, sm) {
    return intToQdot(ip & sm);
}

function broadcastAddress(ip, sm) {
    return intToQdot(ip | (~sm & THIRTY_TWO_BITS));
}

// Parse the array's segments as integers, adding '00' padding 
// (because JS is weird) and converting them to a base-16 string,
// and then removing the prefixed '00's.

function addressToHex(address) {
    var y = address.map(function(x) {
        return ("00" + x.toString(16)).substr(-2);
    }).join('').toUpperCase();

    return "0x" + y;
}

function throwError(error_cause) {
    //var error = "No valid " + error_cause + " entered.\n";
    var error = ["No valid", error_cause, "entered\n"].join(' ');
    process.stdout.write(error);
    process.exit(EXIT_FAILURE);
}

function writeResults(ipInput, submask, base, wildcard, ipClass, networkAddr, netMin, netMax, broadcastAddr, subnet, usable_hosts) {
    process.stdout.write("Address:     " + ipInput + "\n");
    process.stdout.write("Netmask:     " + submask + " = " + base + "\n");
    process.stdout.write("Wildcard:    " + wildcard + "\n");
    process.stdout.write("Class:       " + ipClass + "\n");
    process.stdout.write("-->\n");
    process.stdout.write("Network:     " + networkAddr + "\n");
    process.stdout.write("NetMin:      " + netMin + "\n");
    process.stdout.write("NetMax:      " + netMax + "\n");
    process.stdout.write("Broadcast:   " + broadcastAddr + "\n");
    process.stdout.write("Subnets:     " + subnet + "\n");
    process.stdout.write("Hosts/Net:   " + usable_hosts.toString().replace(
        /\B(?=(\d{3})+(?!\d))/g, ",") + "\n");
}

var hosts = fhosts(base);
var usable_hosts = 2 >= hosts ? hosts.toString().replace(
    /\B(?=(\d{3})+(?!\d))/g, ",") : 0;

var _ip_32bit_int = qdotToInt(ipInputArray);
var _sm_32bit_int = qdotToInt(submaskInputArray);

var networkAddr = networkAddress(_ip_32bit_int, _sm_32bit_int);
var broadcastAddr = broadcastAddress(_ip_32bit_int, _sm_32bit_int);

var ipClass = findClass(ipInputArray[0]);
var subnet = fsubnets(base);
var wildcard = getWildcard(base);

var naa = networkAddr.split('.');
var baa = broadcastAddr.split('.');

naa[3] = +naa[3] + 1;
baa[3] = +baa[3] - 1;

var netMin = naa.join('.');
var netMax = baa.join('.');

writeResults(ipInput, submask, base, wildcard, ipClass, networkAddr, netMin, netMax, broadcastAddr, subnet, usable_hosts);