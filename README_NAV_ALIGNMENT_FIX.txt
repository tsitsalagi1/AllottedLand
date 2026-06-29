AllottedLand.com nav alignment hotfix

Replace ONLY these two files on the site:

1. assets/styles.css
2. assets/v032-visual.css

No HTML, wording, data, scripts, or image files are changed.

What changed:
- Centers the global header nav items vertically after the larger plat-map logo icon was added.
- Makes topnav links inline-flex so text sits centered inside each pill/button.
- Adds small mobile sizing rules for the same alignment.

After upload:
- Clear browser/cache if the old CSS is still showing.
- If your deployment caches assets aggressively, bump the CSS query string in HTML from ?v=054 to a newer value later. This package intentionally does not change HTML because you asked for only the fix files.
