{ var STEP = 4; var level = 0; var entry = false; }

Start = TopLevelStatement+
TopLevelStatement = od:(IntentDefinition/SlotDefinition/AliasDefinition) { return od; }

// ============= Entities =============
EntityOpt = "?"
EntityBody = "[" value:KeywordLiteral "]" { return value }
EntityOptionalBody = "[" value:KeywordLiteral opt:EntityOpt? "]"
    { return { value: value, opt: !!opt  }; }
BasicKeywordLiterals = value:AnyTextWithAlias { return { value: value, type: "Text" }}
// Entities (slot and aliases) allow any text except end of lines and alias definitions
AnyTextWithAlias = v:(t:((!"\r\n")(!"\n")(!"~[") .) { return t.join(""); })+ { return v.join(""); }
BasicValidInner = (OptionalAlias/BasicKeywordLiterals)+
BasicInnerStatement =  Samedent s:BasicValidInner EOS { return s; }
BasicInnerStatements =  BasicInnerStatement+

// Intent
EntityIntentDefinition = "%" value:EntityBody max:IntentMaximumSentences?
    { return { value: value, type: "IntentDefinition", max: max, location: location() } }
IntentMaximumSentences = "(" n:Integer ")" { return n }
// Intents allow any text except end of lines, alias and slot definitions
AnyTextWithSlotAndAlias = v:(t:((!"\r\n")(!"\n")(!"~[")(!"@[") .) { return t.join(""); })+ { return v.join(""); }
IntentKeywordLiterals = value:AnyTextWithSlotAndAlias { return { value: value, type: "Text" }}
IntentValidInner = (OptionalSlot/OptionalAlias/IntentKeywordLiterals)+
IntentInnerStatements =  IntentInnerStatement+
IntentInnerStatement =  Samedent s:IntentValidInner EOS { return s; }
IntentDefinition = EOL? o:EntityIntentDefinition EOL
    Indent s:IntentInnerStatements Dedent
    { return { type: o.type, key: o.value, max: o.max, location: o.location, inner: s } }

// Slot
SlotVariationStartDefinition = "#"
SlotVariationDefinition = SlotVariationStartDefinition id:KeywordLiteral { return id }
EntitySlotDefinition = "@[" value:KeywordLiteral variation:SlotVariationDefinition? "]"
    { return { value: value, type: "SlotDefinition", variation: variation, location: location() } }
SlotOptionalBody = "[" value:KeywordLiteral variation:SlotVariationDefinition? opt:EntityOpt? "]"
    { return { value: value, opt: !!opt, variation: variation }; }
OptionalSlot = "@" op:SlotOptionalBody
    { return { value: op.value, type: "Slot", opt: op.opt, location: location(), variation: op.variation } }
SlotDefinition = EOL? o:EntitySlotDefinition EOL
    Indent s:BasicInnerStatements Dedent
    { return { type: o.type, key: o.value, location: o.location, inner: s, variation: o.variation } }

// Alias
EntityAliasDefinition = "~" value:EntityBody { return { value: value, type: "AliasDefinition", location: location() } }
OptionalAlias = "~" op:EntityOptionalBody { return { value: op.value, type: "Alias", opt: op.opt } }
AliasDefinition = EOL? o:EntityAliasDefinition EOL Indent s:BasicInnerStatements Dedent
    { return { type: o.type, key: o.value, location: o.location, inner: s } }

// ============= Identation =============
Samedent "correct indentation" = s:" "* &{ return s.length === level * STEP; }
Indent = &{ level++; return true; }
Dedent = &{ level--; return true; }

// ============= Primitives =============
KeywordLiteral "word" = v:([a-zA-Z0-9_ \:]+) { return v.join(""); }
Integer "integer" = [0-9]+ { return parseInt(text(), 10); }
EOS "end of sentence" = EOL / EOF
EOL "end of line "= (EOLNonWindows/EOLWindows)+
EOLNonWindows "non windows end of line" = "\n"
EOLWindows "windows end of line" = "\r\n"
EOF = !.
