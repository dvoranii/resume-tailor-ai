import { useResumeBuilder } from "../../context/ResumeBuilderContext";
import type { SectionId } from "@resumeai/shared";
import { Mail, Phone, MapPin, Globe } from "lucide-react";
import linkedinIcon from "../../assets/linked-icon.svg";
import githubIcon from "../../assets/github-icon.svg";
import type { ExperienceCompany, Education, Project } from "@resumeai/shared";

export default function ResumePreview() {
  const { resume, templateConfig } = useResumeBuilder();
  const { personal, summary, experience, education, skills, projects } = resume;
  const {
    sectionOrder,
    sectionTitleColor,
    nameAlignment,
    titleAlignment,
    summaryAlignment,
    contactAlignment,
    experienceOrder,
    educationOrder,
    projectsOrder,
  } = templateConfig;

  const orderedExperience = applyOrder(
    experience,
    experienceOrder
  ) as ExperienceCompany[];
  const orderedEducation = applyOrder(education, educationOrder) as Education[];
  const orderedProjects = applyOrder(projects, projectsOrder) as Project[];

  const ensureAbsoluteUrl = (url: string) => {
    if (!url) return "";
    return url.startsWith("http://") || url.startsWith("https://")
      ? url
      : `https://${url}`;
  };

  const sectionRenderers: Record<SectionId, React.ReactNode> = {
    summary: summary && (
      <Section title="Summary" color={sectionTitleColor}>
        <p
          style={{
            lineHeight: 1.5,
            textAlign: summaryAlignment,
            fontSize: "11px",
          }}
        >
          {summary}
        </p>
      </Section>
    ),
    experience: orderedExperience.length > 0 && (
      <Section title="Experience" color={sectionTitleColor}>
        {orderedExperience.map((company) => (
          <div key={company.id} style={{ marginBottom: "10px" }}>
            {company.roles.map((role, i) => (
              <div key={role.id} style={{ marginBottom: "6px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span style={{ fontWeight: "700", fontSize: "11px" }}>
                    {role.title}
                  </span>
                  <span style={{ fontSize: "11px", color: "#444" }}>
                    {role.startDate}
                    {role.startDate && role.endDate ? " – " : ""}
                    {role.endDate}
                  </span>
                </div>
                {i === 0 && (
                  <div
                    style={{
                      fontStyle: "italic",
                      fontSize: "11px",
                      color: "#444",
                      marginBottom: "4px",
                    }}
                  >
                    {company.companyName}
                    {company.companyName && company.location ? ", " : ""}
                    {company.location}
                  </div>
                )}
                {role.bullets.length > 0 && (
                  <ul
                    style={{
                      paddingLeft: "16px",
                      margin: 0,
                      listStyleType: "disc",
                    }}
                  >
                    {role.bullets.map((bullet) => (
                      <li
                        key={bullet.id}
                        style={{ lineHeight: 1.5, marginBottom: "1px" }}
                      >
                        {bullet.content}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        ))}
      </Section>
    ),
    education: orderedEducation.length > 0 && (
      <Section title="Education" color={sectionTitleColor}>
        {orderedEducation.map((edu) => (
          <div
            key={edu.id}
            style={{ marginBottom: "6px", fontSize: "11px", lineHeight: 1.2 }}
          >
            {[edu.field, edu.institution, edu.degree, edu.graduationYear]
              .filter(Boolean)
              .join("  |  ")}
          </div>
        ))}
      </Section>
    ),
    skills: skills.length > 0 && (
      <Section title="Skills" color={sectionTitleColor}>
        {skills.map((cat) => (
          <div key={cat.id} style={{ lineHeight: 1.5 }}>
            {cat.category && (
              <span style={{ fontWeight: "700" }}>{cat.category}: </span>
            )}
            <span>
              {cat.items.map((item, i) => (
                <span key={i}>
                  {item}
                  {i < cat.items.length - 1 ? ", " : ""}
                </span>
              ))}
            </span>
          </div>
        ))}
      </Section>
    ),
    projects: orderedProjects.length > 0 && (
      <Section title="Projects" color={sectionTitleColor}>
        {orderedProjects.map((project) => (
          <div key={project.id} style={{ marginBottom: "6px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <span style={{ fontWeight: "700" }}>{project.name}</span>
              {project.url && (
                <span style={{ fontSize: "11px", color: "#444" }}>
                  {project.url}
                </span>
              )}
            </div>
            {project.bullets.length > 0 && (
              <ul
                style={{
                  paddingLeft: "16px",
                  margin: 0,
                  listStyleType: "disc",
                }}
              >
                {project.bullets.map((bullet) => (
                  <li
                    key={bullet.id}
                    style={{ lineHeight: 1.5, marginBottom: "1px" }}
                  >
                    {bullet.content}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </Section>
    ),
  };

  return (
    <div className="flex-1 bg-[#f5f5f5] overflow-x-hidden overflow-y-auto  p-6 flex justify-center items-center">
      <div
        style={{
          width: "816px",
          height: "1056px",
          backgroundColor: "#ffffff",
          fontFamily: "Arial, sans-serif",
          fontSize: "11px",
          color: "#000000",
          padding: "43px 48px",
          boxShadow: "0 2px 16px rgba(0,0,0,0.12)",
          flexShrink: 0,
          transform: "scale(0.85) translateY(220px)",
          transformOrigin: "top center",
        }}
      >
        <div style={{ marginBottom: "6px" }}>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "700",
              lineHeight: 1.2,
              textAlign: nameAlignment,
            }}
          >
            {personal.name || "Your Name"}
          </div>
          <div
            style={{
              fontSize: "16px",
              color: sectionTitleColor,
              fontWeight: "600",
              marginTop: "2px",
              textAlign: titleAlignment,
            }}
          >
            {personal.title || "Your Title"}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent:
              contactAlignment === "center" ? "center" : "flex-start",
            gap: "0 6px",
            fontSize: "12px",
            color: "#333",
          }}
        >
          {personal.email && (
            <a
              href="#"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <Mail size={10} color="#333" /> {personal.email}
            </a>
          )}
          {personal.phone && (
            <>
              <span style={{ color: "#aaa" }}>|</span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                }}
              >
                <Phone size={10} color="#333" /> {personal.phone}
              </span>
            </>
          )}
          {personal.location && (
            <>
              <span style={{ color: "#aaa" }}>|</span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                }}
              >
                <MapPin size={10} color="#333" /> {personal.location}
              </span>
            </>
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent:
              contactAlignment === "center" ? "center" : "flex-start",
            gap: "0 6px",
            fontSize: "12px",
            color: "#333",
            marginBottom: "10px",
          }}
        >
          {personal.linkedin && (
            <a
              href={ensureAbsoluteUrl(personal.linkedin)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              <img
                src={linkedinIcon}
                alt=""
                style={{ width: "10px", height: "10px" }}
              />
              {personal.linkedin}
            </a>
          )}
          {personal.github && (
            <>
              <span style={{ color: "#aaa" }}>|</span>
              <a
                href={ensureAbsoluteUrl(personal.github)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                <img
                  src={githubIcon}
                  alt=""
                  style={{ width: "10px", height: "10px" }}
                />
                {personal.github}
              </a>
            </>
          )}
          {personal.portfolio && (
            <>
              <span style={{ color: "#aaa" }}>|</span>
              <a
                href={ensureAbsoluteUrl(personal.portfolio)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                <Globe size={10} color="#333" /> {personal.portfolio}
              </a>
            </>
          )}
        </div>

        {sectionOrder.map((sectionId) => (
          <div key={sectionId}>{sectionRenderers[sectionId]}</div>
        ))}
      </div>
    </div>
  );
}

function applyOrder<T>(items: T[], order: string[]): T[] {
  if (order.length === 0) {
    return [...items].sort((a, b) => {
      const aOrder = (a as any).displayOrder ?? 0;
      const bOrder = (b as any).displayOrder ?? 0;
      return aOrder - bOrder;
    });
  }

  const byId = new Map(
    items.map((item) => {
      const id = (item as any).id;
      return [id, item];
    })
  );

  const ordered = order
    .map((id) => byId.get(id))
    .filter((item): item is T => item !== undefined);

  const remaining = items.filter((item) => !order.includes((item as any).id));
  return [...ordered, ...remaining];
}

function Section({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <div
        style={{
          fontSize: "12px",
          fontWeight: "700",
          color,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          borderBottom: `1px solid ${color}`,
          paddingBottom: "2px",
          marginBottom: "6px",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}
