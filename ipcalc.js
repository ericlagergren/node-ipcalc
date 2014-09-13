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


Author = "Eric Lagergren <ericscottlagergren@gmail.com>";
Bugs = "https://github.com/EricLagerg/node-ipcalc/issues";
Version = "2.0.0";

"use strict"; // It keeps me from doing stupid things with my code

var main = function performCalculations() {

    var two = process.argv[2],
        three = process.argv[3],
        four = process.argv[4];

    // Declare constants*
    // Cannot use 'use strict' and 'const' at the same time right now
    var THIRTY_TWO_BITS = 4294967295,
        MAX_BIT_VALUE = 32,
        MAX_BIT_BIN = 255;

    var submaskInput, ipInput, submask, base, index, theBigString, netFinal, netInit;

    if ("-n" === two || "--host" == two) {
        submaskInput = four;
        ipInput = three;
    } else {
        submaskInput = three;
        ipInput = two;
    }

    if (!three) {

        var x = two.split('/');
        ipInput = x[0];
        base = x[1];
        submask = getSubmask(x[1]);

    } else if (submaskInput <= MAX_BIT_VALUE) {

        base = submaskInput;
        submask = getSubmask(parseInt(submaskInput, 10));

    } else if (4 === submaskInput.split(".").length) {

        base = getCidr(submaskInput);
        submask = submaskInput;

    } else if (submaskInput > MAX_BIT_VALUE) {

        base = getCidrFromHost(submaskInput);
        submask = getSubmask(base);

    }

    // Splits our inputs into arrays to use later
    var ipInputArray = ipInput.split("."),
        submaskInputArray = submask.split(".");
    
    function validate(item_to_val, item_name) {
        var itv_arr = item_to_val.split(".");
        if (4 !== itv_arr.length || "" === item_to_val) {
            throwError(item_name);
        }

        for (var j = 0; j < 4; j++) {
            var itv_int = parseInt(itv_arr[j], 10);
            if (itv_int != itv_arr[j] || itv_int < 0 || itv_int > MAX_BIT_BIN) {
                throwError(item_name);
            }
            itv_arr[j] = itv_int;
        }
    }

    validate(ipInput, "IP");
    validate(submask, "Subnet Mask");

    // Converts an IP/Submask into 32 bit int
    function ipToInt(ip) {
        var x = 0;

        x += +ip[3] << 24 >>> 0;
        x += +ip[2] << 16 >>> 0;
        x += +ip[1] << 8 >>> 0;
        x += +ip[0] >>> 0;

        return x;
    }

    // Reverses the previous functions
    function intToIp(integer) {

        var arr = [24, 16, 8, 0];

        var x = arr.map(function(n) {
            return integer >> n & 0xFF;
        }).reverse().join('.');

        return x;
    }

    function getCidrFromHost(input) {
        // as long as the number of hosts isn't 0, find (log2(hosts)), round 
        // up, and subtract that from MAX_BIT_VALUE to find the correct CIDR
        if (0 !== input) {
            input = (MAX_BIT_VALUE - (Math.ceil((Math.log(input)) / (Math.log(2)))));
        }
        return input;
    }

    function getSubmask(input) {
        var mask = ~0 << (MAX_BIT_VALUE - input);
        return [mask >> 24 & MAX_BIT_BIN,
            mask >> 16 & MAX_BIT_BIN,
            mask >> 8 & MAX_BIT_BIN,
            mask & MAX_BIT_BIN
        ].join('.');
    }

    // Inverse of submask
    function getWildcard(input) {
        var mask = ~(~0 << (MAX_BIT_VALUE - input));
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
        var x = arr.reduce(function(previousValue, currentValue, index, array) {
            return (previousValue << 8 | currentValue) >>> 0;
        });

        // https://github.com/mikolalysenko/bit-twiddle/blob/master/twiddle.js#L63
        // https://github.com/mikolalysenko/bit-twiddle/blob/master/LICENSE
        x -= (x >>> 1) & 0x55555555;
        x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);

        return ((x + (x >>> 4) & 0xF0F0F0F) * 0x1010101) >>> 24;
    }

    function fhosts(hv) {
        hv = hv || 0; // zero out hv
        if (hv >= 2) {
            hv = (Math.pow(2, (MAX_BIT_VALUE - hv)));
            // 2^(total bits - on bits) = off bits
        }
        return hv;
    }

    function fsubnets(base) {
        var mod_base = base % 8;
        return mod_base ? Math.pow(2, mod_base) : Math.pow(2, 8);
    }

    function findClass(ip) {
        if (4 === ipInputArray.length) {
            if (!ip || ip < 0 || 'undefined' === typeof ip) {
                return "No Valid IP Entered";
            }
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
        } else {
            return "No Valid IP Entered";
        }
    }

    function networkAddress(ip, sm) {
        var x = ip & sm;

        return intToIp(x);
    }

    function broadcastAddress(ip, sm) {
        var x = ip | (~sm & THIRTY_TWO_BITS);

        return intToIp(x);
    }

    // Parse the ipInputArray's segments as integers, and then adding '00' 
    // padding (because JS is weird) and converting them to a base-16 string,
    // and then removing the prefixed '00's.

    var hexIp = ipInputArray.map(function(x) {
            var x = +x;
            return ("00" + x.toString(16)).substr(-2);
        }).join('').toUpperCase(),
        hexIp = "0x" + hexIp;

    var hosts = fhosts(base),
        usable_hosts = (hosts - 2) > 0 ? (hosts - 2).toString().replace(
            /\B(?=(\d{3})+(?!\d))/g, ",") : 0;

    var networkAddr = networkAddress(ipToInt(ipInputArray), ipToInt(submaskInputArray)),
        broadcastAddr = broadcastAddress(ipToInt(ipInputArray), ipToInt(submaskInputArray));

    var ipClass = findClass(ipInputArray[0]),
        subnet = fsubnets(base),
        wildcard = getWildcard(base);

    var naa = networkAddr.split('.'),
        baa = broadcastAddr.split('.');

    naa[3] = +naa[3] + 1;
    baa[3] = +baa[3] - 1;

    var netMin = naa.join('.'),
        netMax = baa.join('.');


    function throwError(error_cause) {
        var error = "No Valid " + error_cause + " Entered\n";
        process.stdout.write(error);
        process.exit(1);
    }

    return write(ipInput, submask, base, wildcard, ipClass, networkAddr, netMin, netMax, broadcastAddr, subnet, usable_hosts);
};

function write(ipInput, submask, base, wildcard, ipClass, networkAddr, netMin, netMax, broadcastAddr, subnet, usable_hosts) {
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

function information(arg) {
    process.stdout.write(arg);
}

function parseArgs() {
    var two = process.argv[2],
        three = process.argv[3],
        four = process.argv[4] || null;

    var help = "usage: node ipcalc [-h] [-n | --host] <IPv4 Address> <submask> | <cidr prefix> [hosts OPT]\n\nnode ipcalc help:\n=================\npositional arguments:\n\tIPv4 Address\tValid IPv4 Address\n\n\tSubmask\t\tValid Submask in CIDR\n\t\t\tprefix or quad-dotted form\n\noptional arguments:\n\t-n, --host\tuse number of hosts to find network information\n\t-i, --info\tget author information\n\t-h, --help\tget this message\n\t-v, --version\tget version\n",
        version = Version + "\n",
        author = 'Author: ' + Author + "\nBugs: " + Bugs + "\nVersion: " + Version + "\n";

    if (!two) {
        information(help);
        process.exit(1);
    } else if ("-h" === two || "--help" === two) {
        information(help);
        process.exit(0);
    } else if ("-v" === two || "--version" === two) {
        information(version);
        process.exit(0);
    } else if ("-i" == two || "--info" == two) {
        information(author);
        process.exit(0);
    }
}

if (require.main === module) {
    parseArgs();
    main(process.argv);
}