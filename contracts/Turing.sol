//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

import "hardhat/console.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Turing is ERC20 {
    address public immutable owner;
    address public immutable professor;

    bool public votingOpen = true;

    struct CandidateCodename {
        address addrss;
        string codename;
    }

    /**
     * @dev Array of all the candidates' addresses sorted by the address.
     */
    CandidateCodename[] private _candidates;

    /**
     * @dev Struct that represents a candidate.
     */
    struct CandidateVoters {
        address addrss;
        /**
         * @dev Bitmask of the voters. Each bit represents a voter. If the i-th bit is 1, the _candidates[i] voter has voted for this candidate.
         */
        bytes votersBitmask;
    }

    /**
     * @dev Mapping of the codenames to the candidates' struct.
     */
    mapping(string => CandidateVoters) private _codenamesCandidates;

    /**
     * @dev Set the sorted array of candidates' addresses for the given codenames.
     */
    constructor(
        address _professor,
        address[] memory addresses,
        string[] memory codenames
    ) ERC20("Turing", "TTK") {
        require(
            addresses.length == codenames.length,
            "Candidates input length mismatch"
        );
        require(addresses.length > 0, "Candidates list cannot be empty");

        owner = msg.sender;

        professor = _professor;

        // doesn't check whether the addresses are sorted

        for (uint256 i = 0; i < codenames.length; i++) {
            require(
                _codenamesCandidates[codenames[i]].addrss == address(0),
                "Duplicate codename"
            );

            _candidates.push(
                CandidateCodename({
                    addrss: addresses[i],
                    codename: codenames[i]
                })
            );

            // Calculate needed bytes: 1 byte per 8 voters
            uint256 bitmapSize = (addresses.length + 7) / 8;
            _codenamesCandidates[codenames[i]] = CandidateVoters({
                addrss: addresses[i],
                votersBitmask: new bytes(bitmapSize)
            });
        }
    }

    function getCandidatesCodenames() public view returns (string[] memory) {
        string[] memory codenames = new string[](_candidates.length);
        for (uint256 i = 0; i < _candidates.length; i++)
            codenames[i] = _candidates[i].codename;
        return codenames;
    }

    function issueToken(string calldata codename, uint256 saTurings) public {
        if (msg.sender != professor && msg.sender != owner)
            revert("Only the contract owner or the professor can issue tokens");

        CandidateVoters storage candidate = _codenamesCandidates[codename];
        require(candidate.addrss != address(0), "Codename not registered");

        _mint(candidate.addrss, saTurings);
    }

    function vote(string calldata codename, uint256 saTurings) public {
        require(votingOpen, "Voting is closed");

        require(saTurings <= 2 * (10 ** 18), "Cannot vote more than 2 TTK");

        CandidateVoters storage candidate = _codenamesCandidates[codename];
        require(candidate.addrss != address(0), "Codename not registered");

        require(msg.sender != candidate.addrss, "Cannot vote for yourself");

        uint256 idxVoter = _bsearchVoterIdx(msg.sender);
        require(
            candidate.votersBitmask[idxVoter / 8] &
                bytes1(uint8((1 << (idxVoter % 8)))) ==
                0,
            "Already voted for this candidate"
        );
        candidate.votersBitmask[idxVoter / 8] |= bytes1(
            uint8((1 << (idxVoter % 8)))
        );

        _mint(candidate.addrss, saTurings);
        _mint(msg.sender, .2 * (10 ** 18)); // .2 TTK
    }

    function votingOn() public {
        if (msg.sender != professor && msg.sender != owner)
            revert("Only the contract owner or the professor can open voting");

        votingOpen = true;
    }

    function votingOff() public {
        if (msg.sender != professor && msg.sender != owner)
            revert("Only the contract owner or the professor can close voting");

        votingOpen = false;
    }

    function _bsearchVoterIdx(address target) private view returns (uint256) {
        uint256 low = 0;
        uint256 high = _candidates.length - 1;

        while (low <= high) {
            uint256 mid = (low + high) / 2;
            if (_candidates[mid].addrss == target) {
                return mid;
            } else if (_candidates[mid].addrss < target) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        revert("Voter not found");
    }
}
