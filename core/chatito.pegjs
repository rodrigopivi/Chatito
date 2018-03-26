{ var STEP = 4; var level = 0; var entry = false; }

Start = TopLevelStatement+
TopLevelStatement = od:(ActionDefinition/ArgumentDefinition/AliasDefinition) { return od; }

// ============= Operators =============

OperatorBracketStart = "["
OperatorBracketEnd = "]"
OperatorOpt = "?"
OperatorBody = OperatorBracketStart id:KeywordLiteral OperatorBracketEnd { return id }
OperatorOptionalBody = OperatorBracketStart id:KeywordLiteral opt:OperatorOpt? OperatorBracketEnd
    { return { id: id, opt: !!opt  }; }
BasicValidInner = (OptionalAlias/OptionalKeywordLiteral)+
BasicInnerStatement =  Samedent s:BasicValidInner EOS { return s; }
BasicInnerStatements =  BasicInnerStatement+

// Action
OperatorActionStart = "%" { return "Action" }
OperatorAction = type:OperatorActionStart id:OperatorBody
    { return { id: id, type: type, location: location() } }
ActionValidInner = (OptionalArgument/OptionalAlias/OptionalKeywordLiteral)+
ActionInnerStatements =  ActionInnerStatement+
ActionInnerStatement =  Samedent s:ActionValidInner EOS { return s; }
ActionDefinition = EOL? o:OperatorAction EOL
    Indent s:ActionInnerStatements Dedent
    { return { type: o.type + "Definition", key: o.id, location: o.location, inner: s } }

// Argument
OperatorArgumentStart = "@" { return "Argument" }
OperatorArgumentCustomEntityStart = "#"
OperatorArgumentCustomEntity = OperatorArgumentCustomEntityStart id:CustomEntityKeywordLiteral { return id }
OperatorArgumentDefinition = type:OperatorArgumentStart OperatorBracketStart id:KeywordLiteral entity:OperatorArgumentCustomEntity? OperatorBracketEnd
    { return { id: id, type: type, entity: entity, location: location() } }
OptionalArgument = type:OperatorArgumentStart op:OperatorOptionalBody SPACE?
    { return { id: op.id, type: type, opt: op.opt, location: location() } }
ArgumentDefinition = EOL? o:OperatorArgumentDefinition EOL
    Indent s:BasicInnerStatements Dedent
    { return { type: o.type + "Definition", key: o.id, entity: o.entity, location: o.location, inner: s } }

// Alias
OperatorAliasStart = "~" { return "Alias" }
OperatorAlias = type:OperatorAliasStart id:OperatorBody { return { id: id, type: type } }
OptionalAlias = type:OperatorAliasStart op:OperatorOptionalBody SPACE? { return { id: op.id, type: type, opt: op.opt } }
AliasDefinition = EOL? o:OperatorAlias EOL
    Indent s:BasicInnerStatements Dedent
    { return { type: o.type + "Definition", key: o.id, location: o.location, inner: s } }

// ============= Identation =============
Samedent "correct indentation" = s:" "* &{ return s.length === level * STEP; }
Indent = &{ level++; return true; }
Dedent = &{ level--; return true; }

// ============= Primitives =============
KeywordLiteral = v:([a-zA-Z0-9_ \:]+) { return v.join("") }
CustomEntityKeywordLiteral = v:([a-zA-Z0-9_\/]+) { return v.join("") }
AnyText = v:([^ \n]+) { return v.join("") }
OptionalKeywordLiteral = id:AnyText SPACE?
    { return { id: id, type: "Text" }}
EOS = EOL / EOF
EOL = (EOLNonWindows/EOLWindows)+
EOLNonWindows = "\n"
EOLWindows = "\r\n"
SPACE = " "+
EOF = !.
