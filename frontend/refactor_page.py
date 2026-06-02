import re

with open(r'c:\Users\user\Desktop\CLIENT AUDIT + COMPETITOR AUDIT\frontend\app\page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace in fetchInitialData
old_fetch_1 = """      const response = await fetch(
        `/api/dashboard-audit?profile_url=${encodedUrl}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server returned code ${response.status}: Failed to execute profile audit.`);
      }

      const resData = await response.json();
      setRawApiData(resData);"""

new_fetch_1 = """      const response = await fetch(
        `/api/dashboard-audit?profile_url=${encodedUrl}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server returned code ${response.status}: Failed to start profile audit.`);
      }

      const initData = await response.json();
      const jobId = initData.job_id;
      
      let resData = null;
      while (true) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const statusRes = await fetch(`/api/audit-status/${jobId}`);
        if (!statusRes.ok) throw new Error("Failed to poll status");
        const statusData = await statusRes.json();
        
        if (statusData.status === "completed") {
          resData = statusData.data;
          break;
        } else if (statusData.status === "error") {
          throw new Error(statusData.error || "Background job failed");
        }
      }

      setRawApiData(resData);"""

code = code.replace(old_fetch_1, new_fetch_1)

with open(r'c:\Users\user\Desktop\CLIENT AUDIT + COMPETITOR AUDIT\frontend\app\page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("page.tsx rewritten successfully!")
