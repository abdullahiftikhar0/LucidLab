$files = @("Assets/StreamingAssets/profile.html", "Assets/StreamingAssets/completed_assignments.html")

$bridgeScript = @"
    <script>
        function sendToUnity(message) {
            if (window.Unity) {
                window.Unity.call(message);
            } else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.unityControl) {
                window.webkit.messageHandlers.unityControl.postMessage(message);
            } else {
                console.log("Unity Bridge not found:", message);
            }
        }
    </script>
"@

foreach ($filePath in $files) {
    echo "Processing $filePath..."
    if (Test-Path $filePath) {
        $content = Get-Content -Path $filePath -Raw

        # 1. Fix malformed URLs (&amp; -> &)
        $content = $content -replace '&amp;', '&'

        # 2. Replace Tailwind CDN with local styles.css
        $content = $content -replace '<script src="https://cdn.tailwindcss.com.*"></script>', '<link href="styles.css" rel="stylesheet" />'

        # 3. Inject Bridge Script before </head>
        if ($content -match '</head>') {
            $content = $content -replace '</head>', "$bridgeScript`n</head>"
        }

        # 4. Standardize Navigation
        # Replace Home link
        $content = $content -replace '<a (.*)>.*home</span>.*Home</p>\s*</a>', '<a $1 onclick="sendToUnity(''nav:dashboard'')"><div class="text-primary flex h-8 items-center justify-center relative"><span class="material-symbols-outlined fill-1">home</span><p class="text-primary text-[10px] font-bold uppercase tracking-wider">Home</p></a>'
        
        # Replace Profile link (should lead to profile.html or nav:profile)
        $content = $content -replace '<a (.*)>.*person</span>.*Profile</p>\s*</a>', '<a $1 onclick="sendToUnity(''nav:profile'')"><div class="flex h-8 items-center justify-center relative text-white/40 hover:text-white transition-colors"><span class="material-symbols-outlined">person</span><p class="text-white/40 text-[10px] font-medium uppercase tracking-wider">Profile</p></div></a>'
        
        # 5. Global consistency fixes
        $content = $content -replace '<body class="', '<body class="overflow-x-hidden '

        Set-Content -Path $filePath -Value $content
        echo "Refactored $filePath successfully."
    } else {
        echo "File $filePath not found!"
    }
}
