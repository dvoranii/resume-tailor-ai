import { useResumeBuilder } from "../../context/ResumeBuilderContext";

export default function ResumePreview() {
  const { resume } = useResumeBuilder();
  const { personal, summary, experience, education, skills, projects } = resume;

  return (
    <div className="flex-1 bg-[#f5f5f5] overflow-auto p-6 flex justify-center">
      <div
        style={{
          width: "816px",
          minHeight: "1056px",
          backgroundColor: "#ffffff",
          fontFamily: "Arial, sans-serif",
          fontSize: "10.5px",
          color: "#000000",
          padding: "43px 48px",
          boxShadow: "0 2px 16px rgba(0,0,0,0.12)",
          flexShrink: 0,
        }}
      >
        <div style={{ marginBottom: "6px" }}>
          <div style={{ fontSize: "24px", fontWeight: "700", lineHeight: 1.2 }}>
            {personal.name || "Your Name"}
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "#1155cc",
              fontWeight: "600",
              marginTop: "2px",
            }}
          >
            {personal.title || "Your Title"}
          </div>
        </div>

        <div
          style={{
            marginBottom: "4px",
            display: "flex",
            flexWrap: "wrap",
            gap: "0 6px",
            fontSize: "9.5px",
            color: "#333",
          }}
        >
          {personal.email && <span>✉ {personal.email}</span>}
          {personal.phone && (
            <>
              <span style={{ color: "#aaa" }}>|</span>
              <span>✆ {personal.phone}</span>
            </>
          )}
          {personal.location && (
            <>
              <span style={{ color: "#aaa" }}>|</span>
              <span>⚲ {personal.location}</span>
            </>
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0 6px",
            fontSize: "9.5px",
            color: "#333",
            marginBottom: "10px",
          }}
        >
          {personal.linkedin && <span>in {personal.linkedin}</span>}
          {personal.github && (
            <>
              <span style={{ color: "#aaa" }}>|</span>
              <span>⌥ {personal.github}</span>
            </>
          )}
          {personal.portfolio && (
            <>
              <span style={{ color: "#aaa" }}>|</span>
              <span>⊕ {personal.portfolio}</span>
            </>
          )}
        </div>

        {summary && (
          <Section title="Summary">
            <p style={{ lineHeight: 1.5 }}>{summary}</p>
          </Section>
        )}

        {experience.length > 0 && (
          <Section title="Experience">
            {experience.map((company) => (
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
                      <span style={{ fontWeight: "700", fontSize: "10.5px" }}>
                        {role.title}
                      </span>
                      <span style={{ fontSize: "9.5px", color: "#444" }}>
                        {role.startDate}
                        {role.startDate && role.endDate ? " – " : ""}
                        {role.endDate}
                      </span>
                    </div>
                    {i === 0 && (
                      <div
                        style={{
                          fontStyle: "italic",
                          fontSize: "9.5px",
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
                      <ul style={{ paddingLeft: "16px", margin: 0 }}>
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
        )}

        {education.length > 0 && (
          <Section title="Education">
            {education.map((edu) => (
              <div key={edu.id} style={{ marginBottom: "6px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span style={{ fontWeight: "700" }}>
                    {edu.degree}
                    {edu.field ? ` in ${edu.field}` : ""}
                  </span>
                  <span style={{ fontSize: "9.5px", color: "#444" }}>
                    {edu.graduationYear}
                  </span>
                </div>
                <div
                  style={{
                    fontStyle: "italic",
                    fontSize: "9.5px",
                    color: "#444",
                  }}
                >
                  {edu.institution}
                </div>
              </div>
            ))}
          </Section>
        )}

        {skills.length > 0 && (
          <Section title="Skills">
            {skills.map((cat) => (
              <div key={cat.id} style={{ marginBottom: "4px" }}>
                {cat.category && (
                  <span style={{ fontWeight: "700" }}>{cat.category}: </span>
                )}
                <ul style={{ paddingLeft: "16px", margin: 0 }}>
                  {cat.items.map((item, i) => (
                    <li key={i} style={{ lineHeight: 1.5 }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Section>
        )}

        {projects.length > 0 && (
          <Section title="Projects">
            {projects.map((project) => (
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
                    <span style={{ fontSize: "9.5px", color: "#444" }}>
                      {project.url}
                    </span>
                  )}
                </div>
                {project.bullets.length > 0 && (
                  <ul style={{ paddingLeft: "16px", margin: 0 }}>
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
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <div
        style={{
          fontSize: "10px",
          fontWeight: "700",
          color: "#1155cc",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          borderBottom: "1px solid #1155cc",
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
