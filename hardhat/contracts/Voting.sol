// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Voting {

    // Custom errors for gas efficiency
    error OnlyOwner(address caller);
    error AlreadyVoted(address voter);
    error InvalidCandidateIndex(uint index);
    error NoCandidatesAvailable();
    error EmptyCandidateName();
    error InvalidNewOwner(address newOwner);

    address public owner;
    uint256 public candidateCount;

    struct Candidate {
        string name;
        uint256 voteCount;
    }

    Candidate[] public candidates;
    mapping(address => bool) public hasVoted;

    // Events for better off-chain tracking
    event CandidateAdded(string name, uint256 index);
    event Voted(address indexed voter, uint256 candidateIndex);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner(msg.sender);
        _;
    }

    modifier hasNotVoted() {
        if (hasVoted[msg.sender]) revert AlreadyVoted(msg.sender);
        _;
    }

    // Transfer ownership to a new address
    function transferOwnership(address _newOwner) external onlyOwner {
        if (_newOwner == address(0)) revert InvalidNewOwner(_newOwner);
        if (_newOwner == owner) revert InvalidNewOwner(_newOwner);

        address previousOwner = owner;
        owner = _newOwner;
        emit OwnershipTransferred(previousOwner, _newOwner);
    }

    function addCandidate(string memory _name) external onlyOwner {
        if (bytes(_name).length == 0) revert EmptyCandidateName();
        
        candidates.push(Candidate({
            name: _name,
            voteCount: 0
        }));
        candidateCount++;
        emit CandidateAdded(_name, candidateCount - 1);
    }

    function vote(uint256 _candidateIndex) external hasNotVoted {
        if (_candidateIndex >= candidateCount) revert InvalidCandidateIndex(_candidateIndex);
        
        candidates[_candidateIndex].voteCount++;
        hasVoted[msg.sender] = true;
        emit Voted(msg.sender, _candidateIndex);
    }

    function getCandidates() external view returns (Candidate[] memory) {
        return candidates;
    }

    function getWinner() external view returns (string memory) {
        if (candidateCount == 0) revert NoCandidatesAvailable();

        uint256 winningVoteCount = 0;
        uint256 winningCandidateIndex = 0;
        bool isTie = false;

        for (uint256 i = 0; i < candidateCount; ++i) {
            uint256 currentVotes = candidates[i].voteCount;
            if (currentVotes > winningVoteCount) {
                winningVoteCount = currentVotes;
                winningCandidateIndex = i;
                isTie = false;
            } else if (currentVotes == winningVoteCount && currentVotes > 0) {
                isTie = true;
            }
        }

        return isTie ? "Tie - No clear winner" : candidates[winningCandidateIndex].name;
    }

    function getCandidateCount() external view returns (uint256) {
        return candidateCount;
    }
}