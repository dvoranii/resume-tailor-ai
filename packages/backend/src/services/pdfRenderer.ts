import type { Resume } from "@resumeai/shared";

export function renderResumeToHtml(resume: Resume): string {
  const { personal, summary, experience, education, skills, projects } = resume;

  const ensureAbsoluteUrl = (url: string) => {
    if (!url) return "";
    return url.startsWith("http://") || url.startsWith("https://")
      ? url
      : `https://${url}`;
  };

  const section = (title: string, content: string) => `
    <div style="margin-bottom:10px">
      <div style="font-size:10px;font-weight:700;color:#1155cc;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid #1155cc;padding-bottom:2px;margin-bottom:6px">
        ${title}
      </div>
      ${content}
    </div>
  `;

  const contactItems: string[] = [];
  if (personal.email) contactItems.push(`✉ ${personal.email}`);
  if (personal.phone) contactItems.push(`✆ ${personal.phone}`);
  if (personal.location) contactItems.push(`⚲ ${personal.location}`);

  const linkedinIconSvg = `<svg width="10" height="10" viewBox="0 0 24 24" fill="#007AB9" style="display:inline-block;vertical-align:middle;margin-right:3px;"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`;

  const githubIconSvg = `<svg width="10" height="10" viewBox="0 0 24 24" fill="#000000" style="display:inline-block;vertical-align:middle;margin-right:3px;"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.284-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.333-1.754-1.333-1.754-1.089-.744.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.42-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`;

  const globeIconSvg = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:3px;"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;

  const socialItems: string[] = [];
  if (personal.linkedin) {
    socialItems.push(
      `<a href="${ensureAbsoluteUrl(
        personal.linkedin
      )}" style="color:inherit;text-decoration:none;display:inline-flex;align-items:center;">${linkedinIconSvg}${
        personal.linkedin
      }</a>`
    );
  }
  if (personal.github) {
    socialItems.push(
      `<a href="${ensureAbsoluteUrl(
        personal.github
      )}" style="color:inherit;text-decoration:none;display:inline-flex;align-items:center;">${githubIconSvg}${
        personal.github
      }</a>`
    );
  }
  if (personal.portfolio) {
    socialItems.push(
      `<a href="${ensureAbsoluteUrl(
        personal.portfolio
      )}" style="color:inherit;text-decoration:none;display:inline-flex;align-items:center;">${globeIconSvg}${
        personal.portfolio
      }</a>`
    );
  }

  const experienceHtml =
    experience.length > 0
      ? experience
          .map(
            (company) => `
      <div style="margin-bottom:10px">
        ${company.roles
          .map(
            (role, i) => `
          <div style="margin-bottom:6px">
            <div style="display:flex;justify-content:space-between;align-items:baseline">
              <span style="font-weight:700;font-size:10.5px">${
                role.title
              }</span>
              <span style="font-size:9.5px;color:#444">
                ${role.startDate}${
              role.startDate && role.endDate ? " – " : ""
            }${role.endDate}
              </span>
            </div>
            ${
              i === 0
                ? `<div style="font-style:italic;font-size:9.5px;color:#444;margin-bottom:4px">${
                    company.companyName
                  }${company.companyName && company.location ? ", " : ""}${
                    company.location
                  }</div>`
                : ""
            }
            ${
              role.bullets.length > 0
                ? `<ul style="padding-left:16px;margin:0;list-style-type:disc;">
              ${role.bullets
                .map(
                  (b) =>
                    `<li style="line-height:1.5;margin-bottom:1px">${b.content}</li>`
                )
                .join("")}
            </ul>`
                : ""
            }
          </div>
        `
          )
          .join("")}
      </div>
    `
          )
          .join("")
      : "";

  const educationHtml =
    education.length > 0
      ? education
          .map(
            (edu) => `
            <div style="margin-bottom:6px;font-size:10.5px">
              ${[edu.field, edu.institution, edu.degree, edu.graduationYear]
                .filter(Boolean)
                .join("  |  ")}
            </div>
          `
          )
          .join("")
      : "";

  const skillsHtml =
    skills.length > 0
      ? skills
          .map(
            (cat) => `
        <div style="margin-bottom:4px">
          ${
            cat.category
              ? `<span style="font-weight:700">${cat.category}: </span>`
              : ""
          }
          <span>${cat.items
            .map((item, i) => `${item}${i < cat.items.length - 1 ? ", " : ""}`)
            .join("")}</span>
        </div>
      `
          )
          .join("")
      : "";

  const projectsHtml =
    projects.length > 0
      ? projects
          .map(
            (project) => `
        <div style="margin-bottom:6px">
          <div style="display:flex;justify-content:space-between;align-items:baseline">
            <span style="font-weight:700">${project.name}</span>
            ${
              project.url
                ? `<span style="font-size:9.5px;"><a href="${ensureAbsoluteUrl(
                    project.url
                  )}" style="color:#444;text-decoration:none;">${
                    project.url
                  }</a></span>`
                : ""
            }
          </div>
          ${
            project.bullets.length > 0
              ? `<ul style="padding-left:16px;margin:0;list-style-type:disc;">
            ${project.bullets
              .map(
                (b) =>
                  `<li style="line-height:1.5;margin-bottom:1px">${b.content}</li>`
              )
              .join("")}
          </ul>`
              : ""
          }
        </div>
      `
          )
          .join("")
      : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Resume</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body {
          width: 816px;
          min-height: 1056px;
          background: #ffffff;
          font-family: Arial, sans-serif;
          font-size: 10.5px;
          color: #000000;
          padding: 43px 48px;
          margin: 0 auto;
        }
        @page {
          margin: 0;
          size: 816px 1056px;
        }
        @media print {
          body { margin: 0; padding: 43px 48px; }
          .page-break { page-break-before: always; }
        }
      </style>
    </head>
    <body>
      <div style="margin-bottom:6px">
        <div style="font-size:24px;font-weight:700;line-height:1.2">${
          personal.name || "Your Name"
        }</div>
        <div style="font-size:13px;color:#1155cc;font-weight:600;margin-top:2px">${
          personal.title || "Your Title"
        }</div>
      </div>

      ${
        contactItems.length > 0
          ? `
        <div style="margin-bottom:4px;display:flex;flex-wrap:wrap;gap:0 6px;font-size:9.5px;color:#333">
          ${contactItems
            .map(
              (item, i) => `
            ${i > 0 ? `<span style="color:#aaa">|</span>` : ""}
            <span>${item}</span>
          `
            )
            .join("")}
        </div>
      `
          : ""
      }
      ${
        socialItems.length > 0
          ? `
        <div style="display:flex;flex-wrap:wrap;gap:0 6px;font-size:9.5px;color:#333;margin-bottom:10px">
          ${socialItems
            .map(
              (item, i) => `
            ${
              i > 0
                ? `<span style="color:#aaa;padding-left:2px;padding-right:2px;">|</span>`
                : ""
            }
            <span style="display:inline-flex;align-items:center;">${item}</span>
          `
            )
            .join("")}
        </div>
      `
          : `<div style="margin-bottom:10px"></div>`
      }

      ${
        summary
          ? section("Summary", `<p style="line-height:1.5">${summary}</p>`)
          : ""
      }
      ${experience.length > 0 ? section("Experience", experienceHtml) : ""}
      ${education.length > 0 ? section("Education", educationHtml) : ""}
      ${skills.length > 0 ? section("Skills", skillsHtml) : ""}
      ${projects.length > 0 ? section("Projects", projectsHtml) : ""}
    </body>
    </html>
  `;
}

export async function generatePdf(html: string): Promise<Buffer> {
  const puppeteer = await import("puppeteer");

  const browser = await puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.emulateMediaType("print");

    const pdf = await page.pdf({
      printBackground: true,
      width: "816px",
      height: "1056px",
      margin: {
        top: "0",
        bottom: "0",
        left: "0",
        right: "0",
      },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
