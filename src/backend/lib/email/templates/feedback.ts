import { APIResponse } from '../../../types/api';
import { Feedback } from '../../../models/Feedback';
import { formatScore, formatTimestamp } from '../../../utils/formatting';
import { emailConfig } from '../../../config/email';
import mjml from 'mjml';

/**
 * Human Tasks:
 * 1. Verify MJML template rendering in different email clients
 * 2. Set up email template monitoring for delivery and open rates
 * 3. Configure fallback plain text versions for email templates
 * 4. Review and adjust email template styling for brand consistency
 * 5. Test email template responsiveness across different devices
 */

// Requirement: User Management - Email notifications styling
const FEEDBACK_EMAIL_STYLES = {
  primaryColor: '#3B82F6',
  secondaryColor: '#22C55E',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: '16px',
  lineHeight: '24px'
} as const;

// Requirement: User Management - Email notification copy
const FEEDBACK_EMAIL_COPY = {
  drillSubject: 'Your Case Interview Practice Feedback',
  simulationSubject: 'Your McKinsey Simulation Results',
  greeting: 'Hi {{userName}},',
  drillIntro: "Here's your feedback for the {{drillType}} practice session:",
  simulationIntro: 'Here are your McKinsey simulation results:'
} as const;

/**
 * Generates an HTML email template for drill attempt feedback using MJML
 * Requirement: Email Communications - Integration with Resend for transactional emails
 */
export function generateDrillFeedbackEmail(
  feedback: Feedback,
  userName: string,
  drillType: string
): string {
  const formattedScore = formatScore(feedback.score, 2);
  const formattedTimestamp = formatTimestamp(new Date(), 'ISO');

  const mjmlTemplate = `
    <mjml>
      <mj-head>
        <mj-title>${FEEDBACK_EMAIL_COPY.drillSubject}</mj-title>
        <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" />
        <mj-attributes>
          <mj-all font-family="${FEEDBACK_EMAIL_STYLES.fontFamily}" font-size="${FEEDBACK_EMAIL_STYLES.fontSize}" line-height="${FEEDBACK_EMAIL_STYLES.lineHeight}" />
        </mj-attributes>
      </mj-head>
      <mj-body background-color="#f8fafc">
        <mj-section padding="20px">
          <mj-column>
            <mj-text font-size="24px" color="${FEEDBACK_EMAIL_STYLES.primaryColor}" font-weight="600">
              ${FEEDBACK_EMAIL_COPY.greeting.replace('{{userName}}', userName)}
            </mj-text>
            <mj-text color="#334155">
              ${FEEDBACK_EMAIL_COPY.drillIntro.replace('{{drillType}}', drillType)}
            </mj-text>
            <mj-spacer height="20px" />
            <mj-text font-size="20px" font-weight="600" color="${FEEDBACK_EMAIL_STYLES.secondaryColor}">
              Score: ${formattedScore}
            </mj-text>
            <mj-divider border-color="#e2e8f0" />
            <mj-text color="#334155" font-weight="500">
              Feedback Summary:
            </mj-text>
            <mj-text color="#334155">
              ${feedback.content.summary}
            </mj-text>
            <mj-spacer height="20px" />
            <mj-text color="#334155" font-weight="500">
              Key Strengths:
            </mj-text>
            <mj-text>
              <ul style="margin: 0; padding-left: 20px;">
                ${feedback.content.strengths.map(strength => `<li style="color: #334155; margin-bottom: 8px;">${strength}</li>`).join('')}
              </ul>
            </mj-text>
            <mj-spacer height="20px" />
            <mj-text color="#334155" font-weight="500">
              Areas for Improvement:
            </mj-text>
            <mj-text>
              <ul style="margin: 0; padding-left: 20px;">
                ${feedback.content.improvements.map(improvement => `<li style="color: #334155; margin-bottom: 8px;">${improvement}</li>`).join('')}
              </ul>
            </mj-text>
            <mj-spacer height="20px" />
            <mj-text color="#334155" font-weight="500">
              Recommendations:
            </mj-text>
            <mj-text>
              <ul style="margin: 0; padding-left: 20px;">
                ${feedback.content.recommendations.map(recommendation => `<li style="color: #334155; margin-bottom: 8px;">${recommendation}</li>`).join('')}
              </ul>
            </mj-text>
            <mj-divider border-color="#e2e8f0" />
            <mj-text align="center" color="#64748b" font-size="14px">
              Generated on ${formattedTimestamp}
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `;

  const { html } = mjml(mjmlTemplate, { minify: true });
  return html;
}

/**
 * Generates an HTML email template for simulation attempt feedback using MJML
 * Requirement: Email Communications - Integration with Resend for transactional emails
 */
export function generateSimulationFeedbackEmail(
  feedback: Feedback,
  userName: string
): string {
  const formattedScore = formatScore(feedback.score, 2);
  const formattedTimestamp = formatTimestamp(new Date(), 'ISO');

  const mjmlTemplate = `
    <mjml>
      <mj-head>
        <mj-title>${FEEDBACK_EMAIL_COPY.simulationSubject}</mj-title>
        <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" />
        <mj-attributes>
          <mj-all font-family="${FEEDBACK_EMAIL_STYLES.fontFamily}" font-size="${FEEDBACK_EMAIL_STYLES.fontSize}" line-height="${FEEDBACK_EMAIL_STYLES.lineHeight}" />
        </mj-attributes>
      </mj-head>
      <mj-body background-color="#f8fafc">
        <mj-section padding="20px">
          <mj-column>
            <mj-text font-size="24px" color="${FEEDBACK_EMAIL_STYLES.primaryColor}" font-weight="600">
              ${FEEDBACK_EMAIL_COPY.greeting.replace('{{userName}}', userName)}
            </mj-text>
            <mj-text color="#334155">
              ${FEEDBACK_EMAIL_COPY.simulationIntro}
            </mj-text>
            <mj-spacer height="20px" />
            <mj-text font-size="20px" font-weight="600" color="${FEEDBACK_EMAIL_STYLES.secondaryColor}">
              Overall Score: ${formattedScore}
            </mj-text>
            <mj-divider border-color="#e2e8f0" />
            <mj-text color="#334155" font-weight="500">
              Performance Metrics:
            </mj-text>
            <mj-table>
              ${Object.entries(feedback.metrics).map(([metric, value]) => `
                <tr>
                  <td style="padding: 8px 0; color: #334155; font-weight: 500;">${metric}</td>
                  <td style="padding: 8px 0; color: #334155; text-align: right;">${formatScore(typeof value === 'number' ? value : 0, 2)}</td>
                </tr>
              `).join('')}
            </mj-table>
            <mj-spacer height="20px" />
            <mj-text color="#334155" font-weight="500">
              Feedback Summary:
            </mj-text>
            <mj-text color="#334155">
              ${feedback.content.summary}
            </mj-text>
            <mj-spacer height="20px" />
            <mj-text color="#334155" font-weight="500">
              Key Strengths:
            </mj-text>
            <mj-text>
              <ul style="margin: 0; padding-left: 20px;">
                ${feedback.content.strengths.map(strength => `<li style="color: #334155; margin-bottom: 8px;">${strength}</li>`).join('')}
              </ul>
            </mj-text>
            <mj-spacer height="20px" />
            <mj-text color="#334155" font-weight="500">
              Areas for Improvement:
            </mj-text>
            <mj-text>
              <ul style="margin: 0; padding-left: 20px;">
                ${feedback.content.improvements.map(improvement => `<li style="color: #334155; margin-bottom: 8px;">${improvement}</li>`).join('')}
              </ul>
            </mj-text>
            <mj-divider border-color="#e2e8f0" />
            <mj-text align="center" color="#64748b" font-size="14px">
              Generated on ${formattedTimestamp}
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `;

  const { html } = mjml(mjmlTemplate, { minify: true });
  return html;
}