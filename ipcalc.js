#!/bin/env node

/*jslint node: true */

/**
 * @preserve 
 * @copyright
 * Copyright 2014 Eric Lagergren
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

/** Declare constants*
 * Cannot use 'use strict' and 'const' at the same time right now
 * Const to be used with node --harmony
 * First three are used simply for outputting info
 */
/** 
 * @const 
 * @type {string}
 */
var _AUTHOR_ = "Eric Lagergren <ericscottlagergren@gmail.com>";

/** 
 * @const 
 * @type {string}
 */
var _BUGS_ = "https://github.com/EricLagerg/node-ipcalc/issues";

/** 
 * @const 
 * @type {string}
 */
var _VERSION_ = "4.1.0";

/**
 * Thirty-two bits worth of a number
 *
 * @const 
 * @type {number}
 */
var THIRTY_TWO_BITS = 4294967295;

/**
 * Maximum number of "on" bits
 *
 * @const 
 * @type {number}
 */
var MAX_BIT_VALUE = 32;

/**
 * Maximum binary number 
 *
 * @const 
 * @type {number}
 */
var MAX_BIT_BIN = 255;

/** 
 * Exit success code
 *
 * @const 
 * @type {number}
 */
var EXIT_SUCCESS = 0;

/**
 * Exit failure code
 * 
 * @const 
 * @type {number}
 */
var EXIT_FAILURE = 1;

var two = process.argv[2];
var three = process.argv[3];
var four = process.argv[4];

var submaskInput, /** @type {?string} */ ipInput, /** @type {string} */ submask, /** @type {number} */ base, /** @type {boolean} */ ipFlag;

// Process args because screw importing a lib

var help = "usage: node ipcalc [-h] [-s | --subnets] [-n | --host] <IPv4 Address>[[/]prefix] [netmask] [hosts OPT]\n\nnode ipcalc help:\n=================\n\npositional arguments:\n\tIPv4 Address\tValid IPv4 Address\n\n\tPrefix/netmask\tValid Sub(net)Mask in CIDR\n\t\t\tprefix or quad-dotted form\n\noptional arguments:\n\t-n, --host\tuse number of hosts to find network information\n\t-s, --subnets\tsplit network into smaller subnetworks\n\t-i, --info\tget author information\n\t-h, --help\tget this message\n\t-v, --version\tget version\n",
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
    information(help);
    process.exit(EXIT_FAILURE);
}

/**
 * Prints args passed from cli flags
 *
 * @param var message to print
 */
function information(arg) {
    process.stdout.write(arg);
}

/*
+---------------------+
|  MAIN COMPUTATIONS  |
+---------------------+
*/

submaskInput = three;
ipInput = two;

if (!three) {
    /**
     * If there's not a process.argv[3] then the user's input must
     * be in one of these formats:
     * (1) 192.168.1.1/24
     * (2) 192.168.1.1/255.255.255.0
     * (3) 24
     * (4) 255.255.255.0
     */

    var twoArr = two.split('/');
    var twoArrZero = twoArr[0];
    var twoArrOne = twoArr[1];
    var twoArrLen = twoArr.length;

    if (2 === twoArrLen) {
        // If twoArr returns two values then the user's input must be in
        // formats (1) or (2)

        ipInput = twoArrZero;
        submaskInput = twoArrOne;

        if (submaskInput > MAX_BIT_VALUE) {
            base = getCidrFromHost(submaskInput);
            submask = intToQdot(unpackInt(base));

        } else if (submaskInput <= MAX_BIT_VALUE) {
            base = submaskInput;
            submask = intToQdot(unpackInt(submaskInput));

        } else {
            base = getCidr(submaskInput);
            submask = submaskInput;
        }
    } else if (1 === twoArrLen) {
        // If twoArr returns one value then the user's input must be
        // in formats (3) or (4)

        ipInput = getIpIfEmpty();
        submaskInput = twoArrZero;

        if (4 === twoArrZero.split('.').length) {
            base = getCidr(submaskInput);
            submask = submaskInput;
        } else if (submaskInput <= MAX_BIT_VALUE) {
            base = submaskInput;
            submask = intToQdot(unpackInt(submaskInput));

        } else {
            base = getCidrFromHost(submaskInput);
            submask = intToQdot(unpackInt(base));
        }
    } else {
        throwError('anything');
    }
} else if ("-n" === two || "--host" === two || submaskInput > MAX_BIT_VALUE) {
    // If the submask is larger than 32 it's the number of required hosts
    // Also change around inputs because of the -n/--host flag

    submaskInput = +four;
    ipInput = three;
    base = getCidrFromHost(submaskInput);
    submask = intToQdot(unpackInt(base));

} else if (submaskInput <= MAX_BIT_VALUE) {
    // If the submask's input is <= 32 then it's in CIDR prefix format
    base = submaskInput;
    submask = intToQdot(unpackInt(submaskInput));

} else if (4 === submaskInput.split(".").length) {
    // If the submask can be split into four parts it's in quad-dotted
    // notation
    base = getCidr(submaskInput);
    submask = submaskInput;

}

/** Checks if base isNaN and throws error if true. Also will
 * convert base to int -- not necessary, but prevents JS from switching types
 */
if (isNaN(base)) throwError("prefix or submask");

// Splits our inputs into arrays to use later
var ipInputArray = ipInput.split(".");
var submaskInputArray = submask.split(".");

/**
 * Validates user inputs
 * 
 * @param {string} string to be validated
 * @param {string} type/name of error to be thrown
 */
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

/**
 * Gets IP from user's machine if ipInput is not specified
 * 
 * @return {string} a quad-dotted IPv4 address notation
 */
function getIpIfEmpty() {
    var os = require('os');
    var nwaddr;

    var interfaces = os.networkInterfaces();
    for (var k in interfaces) {
        for (var k2 in interfaces[k]) {
            var address = interfaces[k][k2];
            if (address.family === 'IPv4' && !address.internal) {
                nwaddr = address.address;
            }
        }
    }
    ipFlag = 1;
    return nwaddr;
}

/* UNDER CONSTRUCTION
function numberOfSubnets(arg_list) {
    for (var i = 1; i < arg_list.length; i += 2) {
        if (arg_list[i - 1] !== "-s") {
            throwError("subnet lists");
        }
    }

    if (2 === arg_list.length) {
        // Assume that the user means number of evenly-distrubuted subnets
        hostsPer = arg_list[1];
    } else {

    }
}

numberOfSubnets(process.argv.slice(4));
*/

/**
 * Converts an IP/Submask into 32 bit int
 *
 * @param {Array.<string>} a quad-dotted IPv4 address -> array
 * @return {number} a 32-bit integer representation of an IPv4 address
 */
function qdotToInt(ip) {
    var x = 0;

    x += +ip[0] << 24 >>> 0;
    x += +ip[1] << 16 >>> 0;
    x += +ip[2] << 8 >>> 0;
    x += +ip[3] >>> 0;

    return x;
}

/**
 * Reverses function qdotToInt(ip)
 *
 * @param {number} a 32-bit integer representation of an IPv4 address
 * @return {string} a quad-dotted IPv4 address
 */
function intToQdot(integer) {
    return [integer >> 24 & MAX_BIT_BIN, integer >> 16 & MAX_BIT_BIN, integer >> 8 & MAX_BIT_BIN, integer & MAX_BIT_BIN].join('.');
}

/**
 * Gets CIDR prefix from a {number} of hosts
 *
 * @param {number} int number of hosts
 * @return {number} if param isn't 0, return 32 - ceil(log2(input)), else 0
 */
function getCidrFromHost(input) {
    // as long as the number of hosts isn't 0, find (log2(hosts)), round 
    // up, and subtract that from MAX_BIT_VALUE to find the correct CIDR
    return 0 !== input ? MAX_BIT_VALUE - Math.ceil(Math.log(input) / Math.log(2)) : 0;
}

/**
 * Unpacks 8 bit int
 *
 * @param {number} 8 bit int
 * @return {number} I actually don't know what to call this
 */
function unpackInt(input) {
    return -1 << (MAX_BIT_VALUE - input);
}

/**
 * Gets CIDR prefix from quad-dotted submask
 * Counts number of bits
 *
 * @param {string}
 * @return {number} a short int
 */
function getCidr(input) {

    var arr = input.split('.');

    /** 
     * Similar to:
     * arr = [192.168.0.1]
     * x =  192 << 8 | 168
     * x += 168 << 8 | x
     * x +=   0 << 8 | x
     * x +=   1 << 8 | x
     * return x
     *
     * @param {number} previous value in array
     * @param {number} next value in array
     * @return {number} sum of bitwise shifted numbers
     */
    var x = arr.reduce(function(previousValue, currentValue) {
        return (previousValue << 8 | currentValue) >>> 0;
    });

    /**
     * https://github.com/mikolalysenko/bit-twiddle/blob/master/twiddle.js#L63
     * https://github.com/mikolalysenko/bit-twiddle/blob/master/LICENSE
     */
    x -= (x >>> 1) & 0x55555555;
    x = (x & 0x33333333) + (x >>> 2 & 0x33333333);

    return ((x + (x >>> 4) & 0xF0F0F0F) * 0x1010101) >>> 24;
}

/**
 * Gets total number of usable hosts from on bits
 *
 * @param {number} int number of on bits
 * @return {number} int number of usable hosts
 */
function fhosts(hv) {
    hv = hv || 0; // zero out hv
    if (hv >= 2) {
        // 2^(total bits - on bits) = off bits -2 because of nwork/bcast addrs
        hv = (Math.pow(2, (MAX_BIT_VALUE - hv))) - 2;
    }
    return hv;
}

/**
 * Gets number of subnets from on bits
 *
 * @param {number} int number of on bits
 * @return {number} int number of subnets
 */
function fsubnets(base) {
    var mod_base = base % 8;
    return mod_base ? Math.pow(2, mod_base) : Math.pow(2, 8);
}

/**
 * Gets class of IPv4 address from arr[0]
 *
 * @param {Array.<number>} is first (zero) element in array
 * @return {string|function(string): string} string containing class of address
 */
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
    if (!ip || ip < 0 || 'undefined' === typeof ip || isNaN(ip)) {
        throwError('IP');
    } else {
        // Is there anything else?
        throwError('IP');
    }
}

/**
 * ANDs 32 bit representations of IP and submask to get network address
 *
 * @param {number} 32 bit representation of IP address
 * @param {number} 32 bit representation of submask
 * @return {number} 32 bit representation of IP address (network address)
 */
function networkAddress(ip, sm) {
    return intToQdot(ip & sm);
}

/**
 * ORs 32 bit representations of IP and submask to get broadcast address
 *
 * @param {number} 32 bit representation of IP address
 * @param {number} 32 bit representation of submask
 * @return {number} 32 bit representation of IP address (broadcast address)
 */
function broadcastAddress(ip, sm) {
    return intToQdot(ip | (~sm & THIRTY_TWO_BITS));
}

/**
 * Converts an int to its hex form
 *
 * @param {number} 32 bit int representation of a quad-dotted address
 * @return {string} hex value of address
 */
function addressToHex(address) {
    return "0x" + address.toString(16).toUpperCase();
}

/**
 * "Throws" error when called
 *
 * @param {string} the cause of the error
 */
function throwError(error_cause) {
    var error = ["No valid", error_cause, "entered\n"].join(' ');
    process.stdout.write(error);
    process.exit(EXIT_FAILURE);
}

/**
 * Writes results to console
 *
 * @param {...*} takes result variables and places them in strings that are printed
 */
function writeResults(ipInput, submask, base, wildcard, ipClass, networkAddr, netMin, netMax, broadcastAddr, subnet, usable_hosts) {
    process.stdout.write(warning + '\n--------------------\n\n');
    process.stdout.write("Address:                - " + ipInput + "\n");
    process.stdout.write("Address (hex):          - " + hexAddress + "\n");
    process.stdout.write("Address (decimal):      - " + _ip_32bit_int + "\n");
    process.stdout.write("Netmask:                - " + submask + " = " + base + "\n");
    process.stdout.write("Netmask (hex):          - " + hexMask + "\n");
    process.stdout.write("Netmask (decimal):      - " + _sm_32bit_int + "\n");
    process.stdout.write("Wildcard:               - " + wildcard + "\n");
    process.stdout.write("Class:                  - " + ipClass + "\n");
    process.stdout.write("Network:                - " + networkAddr + "\n");
    process.stdout.write("NetMin:                 - " + netMin + "\n");
    process.stdout.write("NetMax:                 - " + netMax + "\n");
    process.stdout.write("Broadcast:              - " + broadcastAddr + "\n");
    process.stdout.write("Subnets:                - " + subnet + "\n");
    process.stdout.write("Hosts/Net:              - " + usable_hosts + "\n\n-\n");
}

var warning = ipFlag ? "WARNING: IP TAKEN FROM COMPUTER'S NETWORK IP" : "IPv4 address entered";
var hosts = fhosts(base);
var usable_hosts = 2 <= hosts ? hosts.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : 0;
var _ip_32bit_int = qdotToInt(ipInputArray);
var _sm_32bit_int = qdotToInt(submaskInputArray);
var networkAddr = networkAddress(_ip_32bit_int, _sm_32bit_int);
var broadcastAddr = broadcastAddress(_ip_32bit_int, _sm_32bit_int);
var ipClass = findClass(ipInputArray[0]);
var subnet = fsubnets(base);
var wildcard = intToQdot(~_sm_32bit_int);
var hexAddress = addressToHex(_ip_32bit_int);
var hexMask = addressToHex(_sm_32bit_int);
var naa = networkAddr.split('.');
var baa = broadcastAddr.split('.');

naa[3] = +naa[3] + 1;
baa[3] = +baa[3] - 1;

var netMin = naa.join('.');
var netMax = baa.join('.');

writeResults(ipInput, submask, base, wildcard, ipClass, networkAddr, netMin, netMax, broadcastAddr, subnet, usable_hosts);