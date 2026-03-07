$tempDir = Join-Path $env:TEMP "LucidLabScreens"

$failedScreens = @{
    "profile"               = "https://contribution.usercontent.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzc5ODc5MmI5M2M0YTQwODE5MTNiZDVjMzU3NzFiYTRlEgsSBxDH-KDuygEYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDg5Mzg0NDczMjM4NTA3MzA4MA&filename=&opi=89354086"
    "ar_hud"                = "https://contribution.usercontent.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzgyY2M1NTc2M2M3ODQ1OGE4MjU4ZDQzM2VkY2JmYzk3EgsSBxDH-KDuygEYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDg5Mzg0NDczMjM4NTA3MzA4MA&filename=&opi=89354086"
    "completed_assignments" = "https://contribution.usercontent.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2Y0NWU2YWRmNTA5YzRiMmE5YTQ4YzE3YjM5NDM4MDU3EgsSBxDH-KDuygEYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDg5Mzg0NDczMjM4NTA3MzA4MA&filename=&opi=89354086"
}

foreach ($name in $failedScreens.Keys) {
    echo "Retrying $name..."
    $outFile = Join-Path $tempDir "$name.html"
    $success = $false
    for ($i = 0; $i -lt 5; $i++) {
        Start-Sleep -Seconds 5
        Invoke-WebRequest -Uri $failedScreens[$name] -OutFile $outFile
        $content = Get-Content -Path $outFile -TotalCount 1
        if ($content -ne "OK") {
            $success = $true
            echo "Success: $name"
            break
        }
        echo "Attempt $i failed for $name. Content was 'OK'. Retrying..."
    }
    if (-not $success) { echo "PERMANENT FAILURE: $name" }
}

echo "Retry process finished."
