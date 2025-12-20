// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract TicketNFT {
    struct Ticket {
        uint256 eventId;
        address owner;
        bool used;
    }

    mapping(uint256 => Ticket) public tickets;
    uint256 public nextTokenId;

    event TicketMinted(uint256 tokenId, address owner, uint256 eventId);
    event TicketUsed(uint256 tokenId);

    function mintTicket(address user, uint256 eventId) external returns (uint256) {
        uint256 tokenId = nextTokenId++;
        tickets[tokenId] = Ticket(eventId, user, false);
        emit TicketMinted(tokenId, user, eventId);
        return tokenId;
    }

    function markUsed(uint256 tokenId) external {
        require(!tickets[tokenId].used, "Already used");
        tickets[tokenId].used = true;
        emit TicketUsed(tokenId);
    }

    function getTicket(uint256 tokenId) external view returns (Ticket memory) {
        return tickets[tokenId];
    }
}
