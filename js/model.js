function TournamentParticipant (id, name) {
  if (!name) {
    throw "Each participant must have a non-empty name."
  }
  this.id = id;
  this.name = name;
}

function MatchUp (firstParticipant, secondParticipant, depth) {
  var winner = MatchUp.Position.NONE;

  var unwrapParticipant = function(p) {
    var unwrapped = null;
    if (p instanceof TournamentParticipant) {
      unwrapped = p;
    } else if (p instanceof MatchUp) {
      unwrapped = p.getWinner();
    }
    if (unwrapped === null) {
        throw "Can't unwrap participant of " + p;
    }
    return unwrapped;
  };

  this.firstParticipant = firstParticipant;
  this.secondParticipant = secondParticipant;
  this.childMatchups = function() {
    var result = [];
    if (this.firstParticipant instanceof MatchUp) {
      result.push(this.firstParticipant);
    }
    if (this.secondParticipant instanceof MatchUp) {
      result.push(this.secondParticipant);
    }
    return result;
  };

  var participantToString = function(participant) {
    if (participant instanceof TournamentParticipant) {
      return participant.name;
    } else if (participant instanceof MatchUp) {
      var winner = participant.getWinner();
      return winner === null ? "" : winner.name;
    }
  };

  this.participantString = function(participantPosition) {
    return participantToString(this.participantAtPosition(participantPosition));
  };

  this.participantAtPosition = function(participantPosition) {
    var participant = null;
    switch (participantPosition) {
      case MatchUp.Position.FIRST:
        participant = this.firstParticipant;
        break;
      case MatchUp.Position.SECOND:
        participant = this.secondParticipant;
        break;
      default:
        throw "INTERNAL ERROR: can only get the participant string of the first or second participant";
    }
    return participant;
  };

  this.getWinnerPosition = function() {
    return winner;
  };

  this.getWinner = function() {
    switch (winner) {
      case null:
      case MatchUp.Position.NONE:
        return null;
      case MatchUp.Position.FIRST:
        return unwrapParticipant(firstParticipant);
      case MatchUp.Position.SECOND:
        return unwrapParticipant(secondParticipant);
      default:
        throw "INTERNAL ERROR: Invalid winner " + winner;
    }
  };

  this.setWinner = function(position) {
    switch (position) {
      case MatchUp.Position.NONE:
      case MatchUp.Position.FIRST:
      case MatchUp.Position.SECOND:
        winner = position;
        break;
      default:
        throw "Have to use the MatchUp.Position enum to specify winner. Instead got: " + position;
    }
  };

  this.depth = depth;
}

MatchUp.Position = {
  NONE: -1,
  FIRST: 1,
  SECOND: 2
};

function TournamentState (names) {
  var allParticipants = names.map(function (name, index) {
    return new TournamentParticipant(index + 1, name);
  });

  var matchUpGenerator = function (participants, depth) {
    if (participants.length === 0) {
      throw "Can't create a MatchUp with no participants";
    } else if (participants.length === 1) {
      return participants[0];
    } else {
      var midPoint = Math.ceil(participants.length/2);
      if (typeof(depth) === "undefined") {
        depth = 0;
      }
      return new MatchUp(matchUpGenerator(participants.slice(0, midPoint), depth + 1), matchUpGenerator(participants.slice(midPoint), depth + 1), depth)
    }
  };

  this.finalMatchUp = matchUpGenerator(allParticipants);

  var matchupScanner = function(currentMatchUpLevel) {
    if (currentMatchUpLevel.length === 0) { return []; }
    var immediateChildren = Array.prototype.concat.apply(
      [],
      currentMatchUpLevel.map(function(matchUp) { return matchUp.childMatchups(); })
    )
    return currentMatchUpLevel.concat(matchupScanner(immediateChildren));
  };

  this.allMatchUps = function() {
    return matchupScanner([this.finalMatchUp]);
  };
}
