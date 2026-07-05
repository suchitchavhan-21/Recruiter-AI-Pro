export interface ResumeTemplate {
  id: string;
  name: string;
  role: string;
  category: string;
  description: string;
  tips: string[];
  rawText: string;
}

export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: "swe-standard",
    name: "Modern Software Engineer (ATS Standard)",
    role: "Software Engineer",
    category: "Engineering",
    description: "Highly optimized single-column layout using industry-standard headings. Best for Front-End, Back-End, and Full-Stack engineers.",
    tips: [
      "Use the STAR methodology (Situation, Task, Action, Result) for every work bullet point.",
      "Always lead with an active action verb (e.g., 'Architected', 'Spearheaded', 'Optimized').",
      "Explicitly mention your core tech stack inside bullets to maximize keyword density."
    ],
    rawText: `[FIRSTNAME] [LASTNAME]
San Francisco, CA | (555) 123-4567 | yourname@email.com | linkedin.com/in/yourprofile | github.com/yourprofile

PROFESSIONAL SUMMARY
Highly analytical Full-Stack Software Engineer with [Number] years of experience designing, building, and deploying highly concurrent web services and distributed systems. Expert in [Primary Language] and [Secondary Language], with a proven track record of optimizing database latency, containerizing microservices, and leading agile engineering teams to deliver high-impact features.

TECHNICAL COMPETENCY
- Languages & Frameworks: React, TypeScript, Node.js, Express, Go, Python, FastAPI
- Databases & Caching: PostgreSQL, Redis, MongoDB, Elasticsearch
- DevOps & Cloud: AWS (S3, EC2, ECS, Lambda), Docker, Kubernetes, CI/CD (GitHub Actions), Terraform
- Observability & Systems: OpenTelemetry, Prometheus, Grafana, RESTful APIs, gRPC, System Design

PROFESSIONAL EXPERIENCE
[CURRENT_COMPANY_NAME] | San Francisco, CA
Senior Software Engineer | [Month, Year] – Present
- Spearheaded the architectural migration of a legacy monolithic service into a containerized Node.js microservices layout on AWS ECS, reducing average API request latency by 42% (from 180ms to 104ms).
- Architected and implemented a high-performance caching layer using Redis and PostgreSQL index tuning, supporting up to 15,000 peak concurrent socket connections without data loss.
- Mentored a squad of 4 junior engineers, establishing strict code review metrics and test coverage requirements (increasing Jest test coverage from 64% to 92%).
- Designed and integrated an automated CI/CD pipeline using GitHub Actions, decreasing developer deployment cycle times by 35%.

[PREVIOUS_COMPANY_NAME] | San Jose, CA
Software Engineer | [Month, Year] – [Month, Year]
- Developed and shipped 8+ responsive, highly interactive web applications utilizing React 18, TypeScript, and Tailwind CSS, improving core web vitals by 18%.
- Optimized relational database schemas and complex PostgreSQL query scripts, saving $24,000 in yearly database compute costs and decreasing long-running query loads.
- Engineered an automated telemetry monitoring dashboard using Prometheus and Grafana with custom metric collection via OpenTelemetry, reducing production MTTR by 50%.
- Authored comprehensive API design guidelines and system-level documentation, driving developer onboarding time down from 3 weeks to 4 business days.

PERSONAL PROJECTS
Distributed Rate Limiter (TypeScript, Redis, Docker) | [Month, Year]
- Designed a distributed token-bucket rate-limiting middleware used across 3 internal API gateways, processing 2.5M daily requests.
- Leveraged Redis transaction pipelines to guarantee absolute thread safety, maintaining 99.99% system uptime during high-concurrency traffic simulations.

EDUCATION
[UNIVERSITY_NAME] | Stanford, CA
Bachelor of Science in Computer Science | GPA: [3.8/4.0 or remove if below 3.5]
- Honors/Activities: Cum Laude, President of Computer Science Association`
  },
  {
    id: "product-manager",
    name: "Strategic Product Manager (STAR Core)",
    role: "Product Manager",
    category: "Product Management",
    description: "Tailored to display metrics, cross-functional collaboration, roadmapping, and business growth parameters.",
    tips: [
      "Structure bullets around MRDs/PRDs, customer discovery, cross-functional alignment, and product metrics.",
      "Always quantify your business impact (e.g., revenue growth, churn reduction, acquisition costs).",
      "List major tools like Jira, Amplitude, SQL, and Agile Scrum in your skills section."
    ],
    rawText: `[FIRSTNAME] [LASTNAME]
New York, NY | (555) 765-4321 | yourname@email.com | linkedin.com/in/yourprofile

PROFESSIONAL SUMMARY
Results-driven Senior Product Manager with [Number] years of experience directing complex product lifecycles from initial customer discovery to global scale. Expert in data-driven roadmapping, conversion optimization, and cross-functional team coordination (Engineering, UX, Sales). Passionate about turning complex user problems into intuitive, high-growth digital experiences.

TECHNICAL & CORE COMPETENCY
- Product Management: Product Strategy, Agile/Scrum, Roadmap Ownership, PRDs, A/B Testing
- Analytics & Data: SQL (PostgreSQL), Amplitude, Google Analytics, Mixpanel, Tableau, Excel
- Tools & Frameworks: Jira, Confluence, Figma, Miro, Salesforce
- Specialties: B2B SaaS, User Growth, Checkout Conversions, API Integrations

PROFESSIONAL EXPERIENCE
[CURRENT_COMPANY_NAME] | New York, NY
Senior Product Manager | [Month, Year] – Present
- Formulated and executed the strategic product roadmap for the core SaaS checkout platform, increasing end-to-end conversion rates by 14.5% and generating an additional $1.2M in annual recurring revenue (ARR).
- Collaborated with 3 distributed engineering squads and 2 UX designers to launch a self-serve onboarding flow, reducing customer acquisition costs (CAC) by 22% and improving 30-day user retention by 8%.
- Conducted over 50 deep customer interviews to author comprehensive PRDs, leading to the deployment of a new billing engine integrated with Stripe API.
- Implemented a structured Amplitude event logging system to track user drop-offs, driving a data-first approach that resolved 3 critical bottleneck points in the payment pipeline.

[PREVIOUS_COMPANY_NAME] | Austin, TX
Product Manager | [Month, Year] – [Month, Year]
- Directed the complete product lifecycle of a mobile application from prototype to launch, attaining 250,000+ active installs in the first 6 months.
- Managed sprint schedules, product backlogs, and daily stand-ups as Product Owner in a fast-paced Agile environment containing 12 software developers.
- Designed and analyzed 20+ A/B experiments on landing page components, raising average user click-through rates (CTR) by 18.2%.
- Established strategic service-level agreements (SLAs) with external payment gateways, reducing API refund transaction times by 40%.

EDUCATION
[UNIVERSITY_NAME] | Chicago, IL
Bachelor of Science in Business Administration & Informatics | GPA: [3.7/4.0]
- Certifications: Agile Certified Product Manager (ACPM), Certified Scrum Product Owner (CSPO)`
  },
  {
    id: "data-analyst",
    name: "Data Analyst & Business Intelligence",
    role: "Data Analyst / BI Specialist",
    category: "Data Science & Analytics",
    description: "Optimized for highlighting SQL expertise, data pipeline development, data visualization, and reporting accuracy.",
    tips: [
      "Include database names, cloud warehouses (Snowflake, BigQuery), and visualization tools (Tableau, PowerBI).",
      "Mention your contribution to decision-making: how did your analysis change business outcomes?",
      "Quantify data size and pipeline optimization percentages."
    ],
    rawText: `[FIRSTNAME] [LASTNAME]
Seattle, WA | (555) 987-6543 | yourname@email.com | linkedin.com/in/yourprofile | github.com/yourprofile

PROFESSIONAL SUMMARY
Detail-oriented Data Analyst with [Number] years of experience engineering ETL pipelines, writing optimized SQL queries, and translating complex dataset patterns into actionable executive reports. Specialized in Python data stacks, cloud warehouses, and interactive dashboards that guide corporate strategic planning and operational optimization.

CORE TECHNICAL SKILLS
- Programming: SQL (PostgreSQL, BigQuery, Snowflake), Python (Pandas, NumPy, Scikit-learn), R
- Visualization: Tableau, Microsoft Power BI, Looker Studio, matplotlib, seaborn
- Databases & ETL: dbt (data build tool), Apache Airflow, PostgreSQL, Redshift, AWS S3
- Business Domain: A/B Testing, Cohort Analysis, Lifetime Value (LTV), Churn Analysis, Financial Modeling

PROFESSIONAL EXPERIENCE
[CURRENT_COMPANY_NAME] | Seattle, WA
Lead Data Analyst | [Month, Year] – Present
- Re-architected the corporate business intelligence architecture by migrating legacy ETL jobs to a modern Snowflake + dbt pipeline, reducing daily report processing times by 65% (from 4 hours to 85 minutes).
- Designed and maintained 15+ interactive executive Tableau dashboards used by senior leadership daily, identifying a $120,000 annual leak in subscription billing renewals.
- Partnered with product and marketing teams to configure and analyze high-volume A/B experiments, determining optimal promotional pricing tiers that raised trial conversions by 7.2%.
- Established automated data validation models that caught ingestion anomalies early, improving data reporting accuracy from 91% to 99.8%.

[PREVIOUS_COMPANY_NAME] | Boston, MA
Data & Reporting Analyst | [Month, Year] – [Month, Year]
- Wrote and optimized complex SQL queries and window functions across petabyte-scale BigQuery databases, analyzing customer demographics for 4M+ active subscribers.
- Authored custom Python automation scripts that integrated Google Analytics and Salesforce data, saving the sales operations team 12 hours of manual entry weekly.
- Conducted cohort and user churn analysis that identified high-risk customer pools, allowing the customer success team to proactively reduce churn by 4.5% in Q3.
- Standardized the business intelligence KPI glossary, unifying cross-department metrics and resolving critical discrepancies in finance reporting.

EDUCATION
[UNIVERSITY_NAME] | Boston, MA
Bachelor of Science in Statistics & Data Analytics | GPA: [3.9/4.0]
- Honors/Awards: Departmental Honors in Statistics`
  },
  {
    id: "overleaf-jakes",
    name: "Standard Overleaf (LaTeX - Jake's Resume)",
    role: "Software Engineer / Tech Professional",
    category: "Overleaf & LaTeX",
    description: "The gold-standard single-column LaTeX format used on Overleaf.com. Renowned for its clean academic structure and outstanding ATS parse scores.",
    tips: [
      "Copy this raw code and paste it directly into a new project on Overleaf.com.",
      "Ensure you compile with pdfLaTeX (the default compiler in Overleaf).",
      "Do not modify the document's header setup, as it is fully optimized for custom margins."
    ],
    rawText: `%-------------------------
% Resume in Latex - Jake's Template (Overleaf Compliant)
% Optimized for ATS Scanning and Clean Parsing
%------------------------

\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}

\\pagestyle{fancy}
\\fancyhf{} % clear all header and footer fields
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins to fit maximum information elegantly
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1.0in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

% Ensure that generated PDF is machine readable / ATS parsable
\\pdfgentounicode=1

%-------------------------
% Custom commands
\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubSubheading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\textit{\\small#1} & \\textit{\\small #2} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%

\\begin{document}

%----------HEADING----------
\\begin{center}
    \\textbf{\\Huge \\scshape Firstname Lastname} \\\\ \\vspace{1pt}
    \\small 123-456-7890 $|$ \\href{mailto:yourname@email.com}{\\underline{yourname@email.com}} $|$ 
    \\href{https://linkedin.com/in/yourprofile}{\\underline{linkedin.com/in/yourprofile}} $|$
    \\href{https://github.com/yourprofile}{\\underline{github.com/yourprofile}}
\\end{center}

%-----------EDUCATION-----------
\\section{Education}
  \\resumeSubHeadingListStart
    \\resumeSubheading{
      University Name}{Stanford, CA}
      {Bachelor of Science in Computer Science}{Sept. 2020 -- June 2024}
  \\resumeSubHeadingListEnd

%-----------EXPERIENCE-----------
\\section{Experience}
  \\resumeSubHeadingListStart

    \\resumeSubheading{
      Current Company Name}{San Francisco, CA}
      {Senior Software Engineer}{June 2024 -- Present}
      \\resumeItemListStart
        \\resumeItem{Spearheaded architectural migration of legacy monolithic service into containerized Node.js microservices on AWS ECS, reducing average API request latency by 42\\% (from 180ms to 104ms).}
        \\resumeItem{Architected and implemented high-performance caching layer using Redis and PostgreSQL index tuning, supporting up to 15,000 peak concurrent socket connections without data loss.}
        \\resumeItem{Mentored squad of 4 junior engineers, establishing strict code review metrics and test coverage requirements (increasing Jest test coverage from 64\\% to 92\\%).}
      \\resumeItemListEnd
      
    \\resumeSubheading{
      Previous Company Name}{San Jose, CA}
      {Software Engineer}{Aug. 2022 -- June 2024}
      \\resumeItemListStart
        \\resumeItem{Developed and shipped 8+ responsive, highly interactive web applications utilizing React 18, TypeScript, and Tailwind CSS, improving core web vitals by 18\\%.}
        \\resumeItem{Optimized relational database schemas and complex PostgreSQL query scripts, saving \\$24,000 in yearly database compute costs and decreasing long-running query loads.}
      \\resumeItemListEnd

  \\resumeSubHeadingListEnd

%-----------PROJECTS-----------
\\section{Projects}
  \\resumeSubHeadingListStart
    \\resumeProjectHeading{
      \\textbf{Distributed Rate Limiter} $|$ \\emph{TypeScript, Redis, Docker}}{Jan. 2024}
      \\resumeItemListStart
        \\resumeItem{Designed distributed token-bucket rate-limiting middleware used across 3 internal API gateways, processing 2.5M daily requests.}
        \\resumeItem{Leveraged Redis transaction pipelines to guarantee absolute thread safety, maintaining 99.99\\% system uptime during high-concurrency traffic simulations.}
      \\resumeItemListEnd
  \\resumeSubHeadingListEnd

%-----------TECHNICAL SKILLS-----------
\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Languages}{: Java, Python, C/C++, SQL, JavaScript, TypeScript, Go} \\\\
     \\textbf{Frameworks}{: React, Node.js, Express, FastAPI, gRPC} \\\\
     \\textbf{Developer Tools}{: Git, Docker, Kubernetes, AWS, Google Cloud, Terraform} \\\\
     \\textbf{Libraries}{: pandas, NumPy, OpenTelemetry, Prometheus, Grafana}
    }}
 \\end{itemize}

\\end{document}`
  }
];
