var split       = require('split')
var through     = require('through');
var PassThrough = require('stream').PassThrough;

function trimNewline(line) {
  return line.replace(/\r?\n/, '');
}

//returns a stream that splits and parses logfmt into objects
exports.streamParser = function(options){
  var options = options || {};

  var streamParser = new PassThrough();
  var splitter = split(/\b\r?\n\b/, trimNewline, null)
  var self = this;

  var logfmtStream = through(function(line){
    this.queue(self.parse(line))
  }, function(){
    this.queue(null)
  })

  // When a source stream is piped to us, undo that pipe, and save
  // off the source stream piped into our internally managed streams.
  streamParser.on('pipe', function(source) {
    source.unpipe(this);
    this.transformStream = source.pipe(splitter).pipe(logfmtStream);
  });

  // When we're piped to another stream, instead pipe our internal
  // transform stream to that destination.
  streamParser.pipe = function(destination, options) {
    return this.transformStream.pipe(destination, options);
  };

  return streamParser;
}

// returns a stream that stringifies objects
exports.streamStringify = function(options){
  var self = this;
  var options = options || {};
  if(options.hasOwnProperty('delimiter')){
    var delim = options.delimiter;
  }else{
    var delim = "\n";
  }

  return through(function(data){
    this.queue(self.stringify(data) + delim)
  }, function(){
    this.queue(null)
  })
}