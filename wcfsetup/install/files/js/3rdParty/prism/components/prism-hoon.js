define(["prism/prism"], function () {
Prism.languages.hoon = {
	'comment': {
		pattern: /::.*/,
		greedy: true
	},
	'string': {
		pattern: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/,
		greedy: true
	},
	'constant': /%(?:\.[ny]|[\w-]+)/,
	'class-name': /@(?:[a-z0-9-]*[a-z0-9])?|\*/i,
	'function': /(?:\+[-+] {2})?(?:[a-z](?:[a-z0-9-]*[a-z0-9])?)/,
	'keyword': /\.[\^\+\*=\?]|![><:\.=\?!]|=[>|:,\.\-\^<+;/~\*\?]|\?[>|:\.\-\^<\+&~=@!]|\|[\$_%:\.\-\^~\*=@\?]|\+[|\$\+\*]|:[_\-\^\+~\*]|%[_:\.\-\^\+~\*=]|\^[|:\.\-\+&~\*=\?]|\$[|_%:<>\-\^&~@=\?]|;[:<\+;\/~\*=]|~[>|\$_%<\+\/&=\?!]|--|==/
};

return Prism; })