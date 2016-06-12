Array.prototype.isDistinct = function() {
  this.sort();
  for (var i = 1; i < this.length; i++) {
    if (this[i - 1] == this[i])
      return false;
    }
  return true;
};

Array.prototype.shuffle = function() {
  var currentIndex = this.length, temporaryValue, randomIndex;
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = this[currentIndex];
    this[currentIndex] = this[randomIndex];
    this[randomIndex] = temporaryValue;
  }
}

