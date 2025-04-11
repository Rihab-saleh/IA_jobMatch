const ResumeTemplate = ({ personalInfo, workExperience, education, skills, languages , training  }) => {


  console.log('Resume Template Props:', { personalInfo, workExperience, education, skills, languages, training });
  // Define the color scheme based on the example
  const colors = {
    primary: "#003399", // Dark blue for headings
    secondary: "#FF6600", // Orange for accents
    text: "#333333", // Dark gray for main text
    lightText: "#666666", // Light gray for secondary text
    background: "#FFFFFF", // White background
  };

  // Helper function to render language proficiency dots
  const renderProficiencyDots = (level) => {
    const maxDots = 5;
    let filledDots = 0;

    switch (level.toLowerCase()) {
      case 'native': filledDots = 5; break;
      case 'proficient': filledDots = 4; break;
      case 'advanced': filledDots = 3; break;
      case 'intermediate': filledDots = 2; break;
      case 'beginner': filledDots = 1; break;
      default: filledDots = 3; // Default to intermediate
    }

    return (
      <div style={{ display: 'flex', gap: '3px' }}>
        {Array.from({ length: maxDots }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: i < filledDots ? colors.secondary : '#e0e0e0',
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="resume-template" style={{
      fontFamily: 'Arial, sans-serif',
      color: colors.text,
      maxWidth: '800px',
      margin: '0 auto',
      padding: '30px',
      backgroundColor: colors.background,
    }}>
      {/* Header */}
      <header style={{ marginBottom: '25px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          margin: '0',
          textTransform: 'uppercase',
          color: colors.primary,
        }}>
          {personalInfo.firstName} {personalInfo.lastName}
        </h1>
        <h2 style={{
          fontSize: '18px',
          fontWeight: 'normal',
          margin: '5px 0 15px',
          color: colors.secondary,
        }}>
          {personalInfo.professionalTitle}
        </h2>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '14px' }}>
          {personalInfo.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: colors.secondary }}>📱</span>
              <span>{personalInfo.phone}</span>
            </div>
          )}
          {personalInfo.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: colors.secondary }}>✉️</span>
              <span>{personalInfo.email}</span>
            </div>
          )}
          {personalInfo.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: colors.secondary }}>📍</span>
              <span>{personalInfo.location}</span>
            </div>
          )}
          {personalInfo.linkedin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: colors.secondary }}>🔗</span>
              <span>{personalInfo.linkedin}</span>
            </div>
          )}
        </div>
      </header>

      {/* Summary */}
      {personalInfo.summary && (
        <section style={{ marginBottom: '25px' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            color: colors.primary,
            marginBottom: '10px',
          }}>
            Summary
          </h3>
          <p style={{ fontSize: '14px', lineHeight: '1.5', margin: '0' }}>{personalInfo.summary}</p>
        </section>
      )}

      {/* Experience */}
      {workExperience.length > 0 && (
        <section style={{ marginBottom: '25px' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            color: colors.primary,
            marginBottom: '15px',
          }}>
            Experience
          </h3>

          {workExperience.map((exp, index) => (
            <div key={index} style={{ marginBottom: '20px', display: 'flex' }}>
              <div style={{ width: '140px', paddingRight: '15px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: colors.primary }}>
                  {exp.startDate} - {exp.endDate}
                </div>
                <div style={{ fontSize: '14px', marginTop: '5px' }}>
                  {exp.location}
                </div>
              </div>

              <div style={{
                position: 'relative',
                paddingLeft: '20px',
                flex: 1,
                borderLeft: index < workExperience.length - 1 ? `2px solid ${colors.primary}` : 'none',
              }}>
                <div style={{
                  position: 'absolute',
                  left: '-6px',
                  top: '0',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: colors.primary
                }}></div>

                <div style={{ fontSize: '16px', fontWeight: 'bold', color: colors.primary }}>
                  {exp.title}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: colors.secondary, marginBottom: '8px' }}>
                  {exp.company}
                </div>

                {exp.description && (
                  <div style={{ fontSize: '14px' }}>
                    {exp.description.split('\n').map((item, i) => (
                      <div key={i} style={{ display: 'flex', marginBottom: '5px' }}>
                        <span style={{ marginRight: '8px', color: colors.secondary }}>•</span>
                        <span>{item.trim()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section style={{ marginBottom: '25px' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            color: colors.primary,
            marginBottom: '15px',
          }}>
            Education
          </h3>

          {education.map((edu, index) => (
            <div key={index} style={{ marginBottom: '20px', display: 'flex' }}>
              <div style={{ width: '140px', paddingRight: '15px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: colors.primary }}>
                  {edu.startDate} - {edu.endDate}
                </div>
                <div style={{ fontSize: '14px', marginTop: '5px' }}>
                  {edu.location}
                </div>
              </div>

              <div style={{
                position: 'relative',
                paddingLeft: '20px',
                flex: 1,
                borderLeft: index < education.length - 1 ? `2px solid ${colors.primary}` : 'none',
              }}>
                <div style={{
                  position: 'absolute',
                  left: '-6px',
                  top: '0',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: colors.primary
                }}></div>

                <div style={{ fontSize: '16px', fontWeight: 'bold', color: colors.primary }}>
                  {edu.degree}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: colors.secondary, marginBottom: '8px' }}>
                  {edu.institution}
                </div>

                {edu.description && (
                  <p style={{ fontSize: '14px', margin: '5px 0 0' }}>{edu.description}</p>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Training / Courses */}
      {training.length > 0 && (
        <section style={{ marginBottom: '25px' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            color: colors.primary,
            marginBottom: '15px',
          }}>
            Training / Courses
          </h3>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            {training.map((course, index) => (
              <div key={index} style={{ marginBottom: '10px', width: 'calc(50% - 10px)' }}>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: colors.primary }}>{course.name}</div>
                <div style={{ fontSize: '14px', color: colors.secondary }}>{course.institution}</div>
              </div>
            ))}
          </div>
        </section>
      )}

{/* Skills */}
{skills.length > 0 && (
  <section style={{ marginBottom: '25px' }}>
    <h3 style={{
      fontSize: '16px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      color: colors.primary,
      marginBottom: '15px',
    }}>
      Skills
    </h3>

    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {skills.map((skill, index) => (
        <div key={skill._id || index} style={{
          padding: '5px 10px',
          backgroundColor: '#f0f0f0',
          borderRadius: '4px',
          fontSize: '14px',
          color: colors.text,
        }}>
          {skill.name}
        </div>
      ))}
    </div>
  </section>
)}

{/* Languages */}
{languages.length > 0 && (
  <section style={{ marginBottom: '25px' }}>
    <h3 style={{ 
      fontSize: '16px', 
      fontWeight: 'bold', 
      textTransform: 'uppercase', 
      color: colors.primary,
      marginBottom: '15px',
    }}>
      Languages
    </h3>

    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
      {languages.map((lang, index) => {
        // Validate that the object has the required properties
        if (!lang || !lang.name || !lang.level) {
          console.warn(`Invalid language object at index ${index}:`, lang);
          return null; // Skip invalid objects
        }

        return (
          <div key={lang.id || index} style={{ marginBottom: '10px', minWidth: '120px' }}>
            <div style={{ fontSize: '14px', marginBottom: '5px' }}>{lang.name}</div>
            <div style={{ fontSize: '14px', color: colors.lightText, marginBottom: '5px' }}>{lang.level}</div>
            {renderProficiencyDots(lang.level)}
          </div>
        );
      })}
    </div>
  </section>
)}



    </div>
  );
};

export default ResumeTemplate;
