// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import { StringUtils } from "./libraries/StringUtils.sol";

import "@openzeppelin/contracts/utils/Base64.sol";
import "hardhat/console.sol";

contract Domains is ERC721URIStorage, Ownable {

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // domain name initiation
    string public tld;

    // NFT SVGs
    string svgPartOne = '<svg xmlns="http://www.w3.org/2000/svg" width="270" height="270" fill="none"><path fill="url(#a)" d="M0 0h270v270H0z"/><defs><filter id="b" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse" height="270" width="270"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity=".225" width="200%" height="200%"/></filter></defs><path d="M72.863 42.949a4.382 4.382 0 0 0-4.394 0l-10.081 6.032-6.85 3.934-10.081 6.032a4.382 4.382 0 0 1-4.394 0l-8.013-4.721a4.52 4.52 0 0 1-1.589-1.616 4.54 4.54 0 0 1-.608-2.187v-9.31a4.27 4.27 0 0 1 .572-2.208 4.25 4.25 0 0 1 1.625-1.595l7.884-4.59a4.382 4.382 0 0 1 4.394 0l7.884 4.59a4.52 4.52 0 0 1 1.589 1.616 4.54 4.54 0 0 1 .608 2.187v6.032l6.85-4.065v-6.032a4.27 4.27 0 0 0-.572-2.208 4.25 4.25 0 0 0-1.625-1.595L41.456 24.59a4.382 4.382 0 0 0-4.394 0l-14.864 8.655a4.25 4.25 0 0 0-1.625 1.595 4.273 4.273 0 0 0-.572 2.208v17.441a4.27 4.27 0 0 0 .572 2.208 4.25 4.25 0 0 0 1.625 1.595l14.864 8.655a4.382 4.382 0 0 0 4.394 0l10.081-5.901 6.85-4.065 10.081-5.901a4.382 4.382 0 0 1 4.394 0l7.884 4.59a4.52 4.52 0 0 1 1.589 1.616 4.54 4.54 0 0 1 .608 2.187v9.311a4.27 4.27 0 0 1-.572 2.208 4.25 4.25 0 0 1-1.625 1.595l-7.884 4.721a4.382 4.382 0 0 1-4.394 0l-7.884-4.59a4.52 4.52 0 0 1-1.589-1.616 4.53 4.53 0 0 1-.608-2.187v-6.032l-6.85 4.065v6.032a4.27 4.27 0 0 0 .572 2.208 4.25 4.25 0 0 0 1.625 1.595l14.864 8.655a4.382 4.382 0 0 0 4.394 0l14.864-8.655a4.545 4.545 0 0 0 2.198-3.803V55.538a4.27 4.27 0 0 0-.572-2.208 4.25 4.25 0 0 0-1.625-1.595l-14.993-8.786z" fill="#fff"/><defs><linearGradient id="a" x1="0" y1="0" x2="270" y2="270" gradientUnits="userSpaceOnUse"><stop stop-color="#a8caba"/><stop offset="1" stop-color="#5d4157" stop-opacity=".99"/></linearGradient></defs><text x="32.5" y="231" font-size="27" fill="#fff" filter="url(#b)" font-family="Uncial Antiqua,san-serif" font-weight="bold">';
    string svgPartTwo = '</text></svg>';

    // mapping data type to store domain names to addresses
    mapping (string => address ) public domains;

    // storing values 
    mapping (string => string) public records;

    // To get all minted BNS
    mapping (uint => string) public names;

    error Unauthorized();
    error AlreadyRegistered();

    event NewBNSMinted(address _sender, uint256 _tokenId, string _domain, string _record);

    constructor(string memory _tld) ERC721("Brotherhood Name Service","BNS") payable {
        owner = payable(msg.sender);
        tld = _tld;
        console.log("%s name service deployed", _tld);
    }


    // Determine price of a domain name based on length
    function price(string calldata _name) public pure returns(uint) {
        uint len = StringUtils.strlen(_name);
        require(len > 0, "Domain name can't be Null.");
        if (len == 3) {
            return 5 * 10**16;
        } else if (len == 4) {
            return 3 * 10**16;
        } else if (len <= 10) {
            return 10**16;
        } else {
            return len * 10**16;
        }
    }


    // Register domain name against an address
    function _register(string calldata _name) internal {
        // Check that the name is unregistered (explained in notes)
        if(domains[_name] != address(0)) revert AlreadyRegistered();

        uint _price = price(_name);

        //check that enough Matic was paid for the txn to go through
        require(msg.value >= _price, "Not Enough Matic was paid.");

        string memory _domainName = string(abi.encodePacked(_name,".",tld));
        string memory finalSvg = string(abi.encodePacked(svgPartOne, _domainName, svgPartTwo));
        uint256 newRecordId = _tokenIds.current();
        uint256 length = StringUtils.strlen(_name);
        string memory strLen = Strings.toString(length); 
        
        console.log("Registering %s.%s on the contract with tokenID %d", _name, tld, newRecordId);


        string memory json = Base64.encode(
            abi.encodePacked(
                '{"name": "',
                _name,
        '", "description": "A domain on the Ninja name service", "image": "data:image/svg+xml;base64,',
        Base64.encode(bytes(finalSvg)),
        '","length":"',
        strLen,
        '"}'
            )
        );

        string memory finalTokenUri = string( abi.encodePacked("data:application/json;base64,", json));

        _safeMint(msg.sender, newRecordId);
        _setTokenURI(newRecordId, finalTokenUri);

        domains[_name] = msg.sender;

        names[newRecordId] = _name;
        _tokenIds.increment();
    }

    // Set Record data  against domain name
    function _setRecord (string calldata _name, string calldata _record) internal {
        if(domains[_name] != msg.sender) revert Unauthorized();
        records[_name] = _record;
    }    

    function register(string calldata name) public payable {
        _register(name);
        console.log("%s has registered a domain!", msg.sender);
    }
    
    function setRecord (string calldata name, string calldata record) public {
        _setRecord(name, record);
    } 
    
    // Return the domain owners' address
    function getAddress(string calldata name) public view returns (address) {
        return domains[name];        
    }

    // Return Record data
    function getRecord(string calldata name) public view returns (string memory) {
        return records[name];        
    }

    function withdraw() public onlyOwner {
        uint amount = address(this).balance;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Failed to withdraw Matic");
    }


    // Return All Registered domains
    function getAllNames() public view returns (string[] memory) {
        console.log("Getting all names from contract");
        string[] memory allNames = new string[](_tokenIds.current());
        for (uint i = 0; i < _tokenIds.current(); i++) {
            allNames[i] = names[i];
            console.log("Name for token %d is %s", i, allNames[i]);
        }

        return allNames;
    }

}