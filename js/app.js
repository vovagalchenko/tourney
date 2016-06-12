var maxWidth = 1600;
var maxHeight = 900;
var headerHeight = 50;
var currentState = null;
var contentColor = "rgb(200,200,200)";
var clearColor = "rgba(0,0,0,0)";
var participantFocusColor = "rgba(65,65,65,1)";
var highlightColor = "rgba(55,55,55,1)";
var animationDuration = 350
var backgroundColor = "rgb(60,60,60)";
window.onload = function() {
  var body = d3.select("body")
    .attr("style", "background-color: " + backgroundColor + ";");

  body.append("textarea")
    .attr("rows", 30)
    .attr("cols", 50)
    .attr("placeholder", "Enter tournament participants separated by newlines");

  var randomizeCheckboxId = "randomize-checkbox";
  var div = body.append("div")
  div.append("input")
    .attr("id", randomizeCheckboxId)
    .attr("type", "checkbox")
    .attr("checked", "checked")
  div.append("label")
    .attr("for", randomizeCheckboxId)
    .html("Randomize matchups");

  body.append("button")
    .attr("type", "button")
    .html("Start Tournament")
    .on("click", function() {
      var input = d3.select("textarea").node().value;
      var playerNames = input.split("\n");
      if (playerNames.length >= 2 && playerNames.isDistinct()) {
        try {
          if (d3.select("#" + randomizeCheckboxId).node().checked) {
            playerNames.shuffle();
          }
          onDataReceipt(playerNames);
        } catch (e) {
          alert(e);
        }
      } else {
        alert("You must input at least 2 participants. All participants must have unique names.");
      }
    });
}

var onDataReceipt = function(playerNames) {
  currentState = new TournamentState(playerNames);
  
  d3.select("body").selectAll("*").remove();

  var svg = d3.select("body")
    .append("svg")
      .classed("root", true)
      .attr("shape-rendering", "geometricPrecision")
      .attr("height", "100%")
      .attr("width", "100%")
      .attr("viewBox", "0 0 " + maxWidth + " " + maxHeight)
  svg
    .append("rect")
      .attr("fill", backgroundColor)
      .attr("width", maxWidth)
      .attr("height", headerHeight)
      .attr("x", 0)
      .attr("y", 0);

  update();
}

function update() {
  var rootSvg= d3.select("svg.root");

  var allMatchups = currentState.allMatchUps();
  var numStages = allMatchups[allMatchups.length - 1].depth + 1;
  var matchupSvgHeight = 70;
  var matchupSvgWidth = maxWidth/(numStages*2);
  var stages = new Array(numStages).fill().map(function(obj, index) { return index; });

  var clipPathIdForPosition = function(position) {
    return position === MatchUp.Position.FIRST ? "top" : "bottom";
  }
  var addClipPath = function(nodes, position) {
    nodes.append("clipPath")
      .attr("id", clipPathIdForPosition(position))
      .append("rect")
        .attr("y", position === MatchUp.Position.FIRST ? 0 : matchupSvgHeight/2.0)
        .attr("x", 0)
        .attr("height", matchupSvgHeight/2.0)
        .attr("width", matchupSvgWidth);
  };
  rootSvg.selectAll("defs").remove();
  var defs = rootSvg.append("defs");
  addClipPath(defs, MatchUp.Position.FIRST)
  addClipPath(defs, MatchUp.Position.SECOND)

  var phaseText = rootSvg.selectAll("text.phase-text")
    .data(stages);

  var nodeAfterAppendingText = function(nodes, fontSize, fontWeight) {
    return nodes
      .append("text")
      .attr("font-family", "Avenir Next")
      .attr("font-weight", fontWeight)
      .attr("font-size", fontSize)
      .attr("stroke", contentColor)
      .attr("fill", contentColor)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "central")
      .attr("y", headerHeight/2.0)
      .attr("height", headerHeight)
      .attr("pointer-events", "none");
  };

  var newText = nodeAfterAppendingText(phaseText.enter(), 22, "normal")
    .classed("phase-text", true)

  phaseText
    .attr("x", function(stage) {
      var totalNumStages = newText.data().length;
      var segmentWidth = (maxWidth/totalNumStages);
      return (totalNumStages - stage - 1) * segmentWidth + (segmentWidth/2.0);
    })
    .attr("width", maxWidth/newText.data().length)
    .html(function(stage) {
      if (stage == 0) {
        return "Finals";
      } else if (stage == 1) {
        return "Semifinals";
      } else {
        return "Round " + (newText.data().length - stage);
      }
    });

  phaseText.exit().remove();

  var phaseRects = rootSvg.selectAll("rect.phase-rect")
    .data(stages);

  var newPhaseRects = phaseRects.enter()
    .append("rect")
    .classed("phase-rect", true)
    .attr("y", headerHeight)

  phaseRects
    .attr("height", maxHeight - headerHeight)
    .attr("fill", function(d) {
      return d % 2 === 0 ? "rgb(68,69,68)" : "rgb(80,80,80)";
    })
    .attr("width", function(d) {
      return Math.ceil(maxWidth/newPhaseRects.data().length);
    })
    .attr("x", function(d) {
      return Math.floor(d*(maxWidth/newPhaseRects.data().length));
    });

  phaseRects.exit().remove();


  var matchupSvgX = function(matchup) {
    return (numStages - matchup.depth - 1) * (maxWidth / numStages)
            + maxWidth / (numStages * 4);
  };
  var matchupSvgY = function(matchup, index) {
    var revStage = matchup.depth;
    var firstSiblingIndex = Math.pow(2, revStage) - 1;
    var maxNumSiblings = Math.min(Math.pow(2, revStage), allMatchups.length - firstSiblingIndex);
    var verticalIndex = index - firstSiblingIndex;
    var sectionHeight = (maxHeight - headerHeight)/maxNumSiblings;
    var sectionOrigin = headerHeight + sectionHeight*verticalIndex;
    return sectionOrigin + (sectionHeight - matchupSvgHeight)/2.0;
  };

  var matchupLines = rootSvg.selectAll("g.matchup-guide")
    .data(allMatchups);

  var newMatchupLines = matchupLines.enter()
    .append("g")
    .classed("matchup-guide", true);
  var winner = currentState.finalMatchUp.getWinner();
  var nodesByAddingPolyline = function(enterNodes, updateNodes, position) {
    var isWinnerStroke = function(matchup) {
      return winner !== null && matchup.getWinner() === winner && matchup.getWinnerPosition() === position;
    };
    enterNodes
      .append("polyline")
      .classed("matchup-guide-" + position, true)
      .attr("fill", "none");
    updateNodes
      .select("polyline.matchup-guide-" + position)
      .attr("stroke", function(matchup) {
        return isWinnerStroke(matchup) ? "white" : contentColor;
      })
      .attr("stroke-width", function(matchup) {
        return isWinnerStroke(matchup) ? 3 : 1;
      })
      .attr("points", function(matchup, index) {
        var participant = matchup.participantAtPosition(position);
        if (participant instanceof MatchUp) {
          var sourceMatchup = participant;
          var initialX = matchupSvgX(matchup);
          var initialY = matchupSvgY(matchup, index) + (matchupSvgHeight * (position === MatchUp.Position.FIRST ? 0.25 : 0.75));
          var midX = (initialX - (matchupSvgWidth/2.0));
          var targetX = midX - (matchupSvgWidth/2.0);
          var targetY = matchupSvgY(sourceMatchup, allMatchups.indexOf(sourceMatchup)) + (matchupSvgHeight / 2.0);
          return initialX + "," + initialY + " "
               + midX + "," + initialY + " " 
               + midX + "," + targetY + " "
               + targetX + "," + targetY;
        } else {
          return null;
        }
               
      });
  }
  nodesByAddingPolyline(newMatchupLines, matchupLines, MatchUp.Position.FIRST);
  nodesByAddingPolyline(newMatchupLines, matchupLines, MatchUp.Position.SECOND);

  matchupLines.exit().remove();

  var matchupSvgs = rootSvg.selectAll("svg.matchup")
    .data(allMatchups);

  var newMatchUpSvgs = matchupSvgs.enter()
    .append("svg")
    .classed("matchup", true)
    .attr("height", matchupSvgHeight);

  matchupSvgs
    .attr("x", matchupSvgX)
    .attr("y", matchupSvgY)
    .attr("width", matchupSvgWidth);

  var matchupRectStrokeWidth = 1.0;
  newMatchUpSvgs
    .append("line")
    .classed("matchup-separator", true)
    .attr("x1", 0)
    .attr("y1", matchupSvgHeight/2.0)
    .attr("y2", matchupSvgHeight/2.0)
    .attr("stroke", "rgb(50,50,50)")
    .attr("stroke-width", matchupRectStrokeWidth);

  matchupSvgs.select("line.matchup-separator").attr("x2", matchupSvgWidth);

  var addMatchupRect = function(nodes) {
    return nodes
      .append("rect")
      .attr("height", matchupSvgHeight- (matchupRectStrokeWidth * 2.0))
      .attr("x", matchupRectStrokeWidth)
      .attr("y", matchupRectStrokeWidth)
      .attr("rx", 15)
      .attr("ry", 15)
  }

  var highlightRectClassForPosition = function(position) {
    return "highlight-" + clipPathIdForPosition(position);
  }
  var blurredHighlightRectFill = function(element, matchup) {
      return element.__participant_position__ === matchup.getWinnerPosition() ? highlightColor : clearColor;
  };
  var addHighlightRect = function(nodes, position) {
    var highlightRects = addMatchupRect(nodes)
      .classed(highlightRectClassForPosition(position), true)
      .property("__participant_position__", position)
      .attr("clip-path", "url(#" + clipPathIdForPosition(position) + ")")
      .attr("cursor", "pointer")
      .on("mouseover", function(matchup) {
        d3.select(this).attr("fill", participantFocusColor);
      })
      .on("mouseout", function() {
        d3.select(this).attr("fill", function(matchup) {
            return blurredHighlightRectFill(this, matchup);
        });

      })
      .on("click", function(matchup) {
        matchup.setWinner(position);
        update();
      });
  };
  
  addHighlightRect(newMatchUpSvgs, MatchUp.Position.FIRST);
  addHighlightRect(newMatchUpSvgs, MatchUp.Position.SECOND);

  matchupSvgs.selectAll("rect." + highlightRectClassForPosition(MatchUp.Position.FIRST) +
                      ", rect." + highlightRectClassForPosition(MatchUp.Position.SECOND))
    .attr("width", maxWidth/(numStages*2) - (matchupRectStrokeWidth * 2.0))
    .attr("fill", function(matchup) {
      return blurredHighlightRectFill(this, matchup);
    })
    .attr("pointer-events", function(matchup) {
      return matchup.participantString(MatchUp.Position.FIRST) === "" ||
             matchup.participantString(MatchUp.Position.SECOND) === "" ||
             matchup.getWinnerPosition() === this.__participant_position__ ? "none" : "auto";
    });

  addMatchupRect(newMatchUpSvgs)
    .classed("matchup-frame", true)
    .attr("fill", clearColor)
    .attr("stroke", contentColor)
    .attr("stroke-width", matchupRectStrokeWidth)
    .attr("pointer-events", "none");

  matchupSvgs.select("rect.matchup-frame").attr("width", maxWidth/(numStages*2) - (matchupRectStrokeWidth * 2.0));

  nodeAfterAppendingText(newMatchUpSvgs, 20, "lighter")
    .attr("y", matchupSvgHeight/4.0)
    .attr("x", matchupSvgWidth/2.0)
    .classed("participant-name-" + clipPathIdForPosition(MatchUp.Position.FIRST), true)
    .property("__matchup_position__", MatchUp.Position.FIRST);

  nodeAfterAppendingText(newMatchUpSvgs, 20, "lighter")
    .attr("y", matchupSvgHeight*0.75)
    .attr("x", matchupSvgWidth/2.0)
    .classed("participant-name-" + clipPathIdForPosition(MatchUp.Position.SECOND), true)
    .property("__matchup_position__", MatchUp.Position.SECOND);

  matchupSvgs.selectAll("text.participant-name-" + clipPathIdForPosition(MatchUp.Position.FIRST) +
                      ", text.participant-name-" + clipPathIdForPosition(MatchUp.Position.SECOND))
    .transition()
    .duration(function() {
      return this.innerHTML === "" ? 0 : animationDuration;
    })
    .attr("opacity", function(matchup) {
      return this.innerHTML === matchup.participantString(this.__matchup_position__) ? 1.0 : 0.0;
    })
    .each("end", function() {
      d3.select(this).html(function(matchup) {
        return matchup.participantString(this.__matchup_position__);
      })
        .transition()
        .duration(animationDuration)
        .attr("opacity", 1.0);
    })

  matchupSvgs.exit().remove();
}
