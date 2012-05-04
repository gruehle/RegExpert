/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global $, CodeMirror, highlightMatches, updateMatchTip */

$(function () {
    'use strict';
    
    var updatingMatches;
    var searchField;
    var resultField = CodeMirror.fromTextArea(
        document.getElementById("results"),
        {
            onChange: function () {
                if (searchField && resultField && !updatingMatches) {
                    highlightMatches();
                }
            }
        }
    );
    
    searchField = CodeMirror.fromTextArea(
        document.getElementById("regexp-input"),
        {
            onChange: function () {
                if (searchField && resultField) {
                    highlightMatches();
                }
            }
        }
    );
    
    function showError(msg) {
        var $errorBox = $("#input-error");
        
        if (msg) {
            $errorBox.text(msg);
            $errorBox.css("visibility", "");
        } else {
            $errorBox.text("No Error");
            $errorBox.css("visibility", "hidden");
        }
    }

    var errorMarks;
    
    function clearExpressionErrors() {
        if (errorMarks) {
            errorMarks.forEach(function (markObj) {
                markObj.clear();
            });
        }
        errorMarks = [];
    }
    
    function highlightExpressionErrors() {
        var exprText = searchField.getValue();
    }
    
    // Array of CodeMirror mark object for all matches
    var matchMarks;
    
    function highlightMatches() {
        var resultText = resultField.getValue();
        
        updatingMatches = true;
        
        // Clear the old marks
        if (matchMarks) {
            resultField.operation(function () {
                matchMarks.forEach(function (markObj) {
                    markObj.clear();
                });
            });
        }
        matchMarks = [];
        
        // Find new matches
        var regEx;
        
        showError(null);
        
        try {
            var searchText = searchField.getValue();
            clearExpressionErrors();
            if (searchText) {
                regEx = new RegExp(searchText, "gi"); // TODO: flags
            }
        } catch (e) {
            highlightExpressionErrors();
            showError(e.message);
            regEx = null;
        }
        
        function getPos(offset) {
            return {
                line: resultText.substr(0, offset).split("\n").length - 1,
                ch: (offset - 1) - resultText.lastIndexOf("\n", offset - 1)
            };
        }
        
        if (regEx && resultText.search(regEx) !== -1) {
            resultField.operation(function () {
                var currentMatch;
                var lastIndex = -1;
                
                regEx.index = 0;
                
                while ((currentMatch = regEx.exec(resultText)) !== null) {
                    var matchLength = currentMatch[0].length;
                    var startPos = getPos(currentMatch.index);
                    var endPos = getPos(currentMatch.index + matchLength);
                    var marker = resultField.markText(
                        startPos,
                        endPos,
                        "match-highlight"
                    );
                    
                    marker.match = currentMatch;
                    matchMarks.push(marker);
                    
                    // Avoid infinite loop
                    if (currentMatch.index === lastIndex) {
                        break;
                    }
                    
                    lastIndex = currentMatch.index;
                }
            });
        }
        
        updatingMatches = false;
    }
        
    var displayedMarker;
    var focusedRange;
        
    function updateMatchTip(e) {
        var marker = resultField.findMarksAt(resultField.coordsChar({x: e.pageX, y: e.pageY}))[0];
        
        if (marker !== displayedMarker) {
            var $matchTip = $("#match-tip");
            
            // Hide existing display
            $matchTip.hide();
            if (focusedRange) {
                focusedRange.clear();
                focusedRange = null;
            }
            
            if (marker) {
                var i;
                var match = marker.match;
                var html = "index: " + match.index + "<br>" +
                        "length: " + match[0].length + "<br>";
                
                if (match.length > 1) {
                    html += "groups:<br><blockquote><ol>";
                    for (i = 1; i < match.length; i++) {
                        html += "<li>" + match[i] + "</li>";
                    }
                    html += "</ol></blockquote>";
                }
                
                var range = marker.find();
                var fromCoords = resultField.charCoords(range.from);
                var toCoords = resultField.charCoords(range.to);
                
                focusedRange = resultField.markText(range.from, range.to, "focused");
                $matchTip.html(html);
                $matchTip.css("left", fromCoords.x);
                $matchTip.css("top", toCoords.yBot);
                $matchTip.show();
            }
            
            displayedMarker = marker;
        }
    }

    $("#results-holder").mousemove(updateMatchTip);
    $("#match-tip").hide();
    
    CodeMirror.commands.selectAll(searchField);
    searchField.focus();
    showError(null);
});