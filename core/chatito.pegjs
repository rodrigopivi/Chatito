{ var STEP = 4; var level = 0; var entry = false; }

Start = TopLevelStatement+
TopLevelStatement = od:(ActionDefinition/ArgumentDefinition/AliasDefinition) { return od; }

// ============= Operators =============

OperatorBracketStart = "["
OperatorBracketEnd = "]"
OperatorOpt = "?"
OperatorBody = OperatorBracketStart id:KeywordLiteral OperatorBracketEnd { return id }
BasicValidInner = (OptionalAlias/OptionalKeywordLiteral)+
BasicInnerStatement =  Samedent s:BasicValidInner EOS { return s; }
BasicInnerStatements =  BasicInnerStatement+

// Action
OperatorActionStart = "%" { return "Action" }
OperatorAction = type:OperatorActionStart id:OperatorBody {
    return { id: id, type: type, location: location() }
}
ActionValidInner = (OptionalArgument/OptionalAlias/OptionalKeywordLiteral)+
ActionInnerStatements =  ActionInnerStatement+
ActionInnerStatement =  Samedent s:ActionValidInner EOS { return s; }
ActionDefinition = EOL? o:OperatorAction EOL
    Indent s:ActionInnerStatements Dedent
    { return { type: o.type + "Definition", key: o.id, inner: s } }

// Argument
OperatorArgumentStart = "@" { return "Argument" }
OperatorArgument = type:OperatorArgumentStart id:OperatorBody {
    return { id: id, type: type, location: location() }
}
OptionalArgument = o:OperatorArgument opt:OperatorOpt? SPACE?
    { return { id: o.id, type: o.type, opt: !!opt, location: o.location } }
ArgumentDefinition = EOL? o:OperatorArgument EOL
    Indent s:BasicInnerStatements Dedent
    { return { type: o.type + "Definition", key: o.id, inner: s } }

// Alias
OperatorAliasStart = "~" { return "Alias" }
OperatorAlias = type:OperatorAliasStart id:OperatorBody { return { id: id, type: type } }
OptionalAlias = o:OperatorAlias opt:OperatorOpt? SPACE?
    { return { id: o.id, type: o.type, opt: !!opt } }
AliasDefinition = EOL? o:OperatorAlias EOL
    Indent s:BasicInnerStatements Dedent
    { return { type: o.type + "Definition", key: o.id, inner: s } }

// ============= Identation =============
Samedent "correct indentation" = s:" "* &{ return s.length === level * STEP; }
Indent = &{ level++; return true; }
Dedent = &{ level--; return true; }

// ============= Primitives =============
KeywordLiteral = v:([a-zA-Z0-9]+) { return v.join("") }
AnyText = v:([^ \n]+) { return v.join("") }
OptionalKeywordLiteral = id:AnyText SPACE?
    { return { id: id, type: "Text" }}
EOS = EOL / EOF
EOL = "\n"+
SPACE = " "+
EOF = !.
