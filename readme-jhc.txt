== Before you begin
Read ALL related wiki pages:
https://wiki.5e.tools/index.php/Homebrew:_Overview

Get notepad++ or a suitable text editor:
https://notepad-plus-plus.org/downloads/

Or get VisualStudioCode:
https://code.visualstudio.com/

Or get both, or something else ...
But you do want a nice editor with syntax highlighting, source folding and a JSON Tree view.

Get a node.js environment, e.g. GraalVM (download, extract, add to PATH)
https://www.graalvm.org/

I also highly recommend using git bash (part of git for windows, if you are on windows).
https://git-scm.com/download/win


== Optional
This git repo does not contain the image files.
Get them here: https://get.5e.tools/


== Start-up
From the root dir of the git repo run at the command line
npm run serve:dev
that starts a local webserver accessible at:
http://localhost:5000/5etools

To stop the server hit ctrl + c.

READ: http://localhost:5000/renderdemo.html

Now go go go


== Process
Attention, e.g. classFeatures and class->classFeatures mean different nodes in the JSON tree.

Copy class from data folder to homebrew folder, rename accordingly.
Insert META JSON, JHC-$CLASSNAME
Change class to starred (*) version, update source to house rules and change pagenumber
Delete all subclassFeature entries, sans one.
Delete all class->class feature->entries from UA.
Update class->class feature->entries to include the house rule ones. Replace TCE entries with JHC-$CLASSNAME entries.
Delete all classFeature entries that come from the PHB or UA. Keep the ones to be changed!
Change remaining classFeatures entries to house rules.
Update the class table, and cantripProgression and spellProgression (yeah sometimes its double data ...)
Update also the @filter tags in the table or references to spell lists
Update class->subclasses->entries, delete UA, keep PHB, but modify to JHC where applicable, order alphabetically
Add houserule subclassFeatures

You could include classSpells - but I have the LaTeX sources of the lists, so it is probably quicker if I do that semi-automatically.


== Tips
For reference look at jhc-class-rogue.json.

Use JSON Lint to quickly find syntax errors:
https://jsonlint.com/

Add the current file you are working on to the index.json in the homebrew folder.
To see changes from the JSON apear on you local server you have to refresh TWICE with ctrl + f5.
Sometimes a cache refresh (ctrl + f5) is not enough to get the new data, in that case
 a) REMOVE the entry in the index.json
 b) go to the homebrew manager (utilitites) -> delete all
 c) ctrl + f5
 d) re-add the file to index.json
 e) ctrl + f5 TWICE
 
If it is still not showing you have most likely a syntax error somewhere.
Missing or to many commas (,) or doubled "" are high up on the list, use JSON Lint.

If you copy/paste from the PDF replace ’ with '.
Clean up line breaks.