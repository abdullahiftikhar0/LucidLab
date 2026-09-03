$tempDir = Join-Path $env:TEMP "LucidLabScreens"
$files = Get-ChildItem -Path $tempDir -Filter *.html

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

foreach ($file in $files) {
    echo "Refactoring $($file.Name)..."
    $content = Get-Content -Path $file.FullName -Raw

    # 1. Replace Tailwind CDN with local stylesheet
    $content = $content -replace '<script src="https://cdn.tailwindcss.com.*"></script>', '<link href="styles.css" rel="stylesheet" />'
    
    # 2. Remove specific font links (already in styles.css or redundant)
    $content = $content -replace '<link href="https://fonts.googleapis.com.*" rel="stylesheet">', ''
    
    # 3. Inject Bridge Script before </head>
    if ($content -match '</head>') {
        $content = $content -replace '</head>', "$bridgeScript`n</head>"
    }

    # 4. Global consistency fixes (ensure body has hidden overflow, etc.)
    $content = $content -replace '<body class="', '<body class="overflow-x-hidden '

    Set-Content -Path $file.FullName -Value $content
}

echo "Batch refactoring complete."
