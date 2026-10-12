import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Col, Row, Spinner } from 'react-bootstrap'
import { profileApi } from '@/services/api/profileApi'
import { CRICKET_SKILL_LABELS } from '@/constants/cricketSkills'

type Answers = Record<string, string | number>

/** Read-only cricketing skills, saved when the member registers for a cricket tournament. */
export default function CricketSkillsCard() {
  const [skills, setSkills] = useState<Answers | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    profileApi
      .listPersonaProfiles()
      .then((res) => {
        if (!cancelled) setSkills(res.data.find((p) => p.persona_type === 'cricketer')?.answers ?? null)
      })
      .catch(() => { if (!cancelled) setSkills(null) })
    return () => { cancelled = true }
  }, [])

  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Body className="p-4">
        <h5 className="mb-3">Cricketing Skills</h5>
        {skills === undefined ? (
          <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
        ) : skills && Object.keys(skills).length > 0 ? (
          <Row className="g-3">
            {CRICKET_SKILL_LABELS.map(({ key, label }) => (
              <Col sm={6} md={4} key={key}>
                <div className="profile-field">
                  <span className="profile-field__label">{label}</span>
                  <span className="profile-field__value">{skills[key] ?? '—'}</span>
                </div>
              </Col>
            ))}
          </Row>
        ) : (
          <p className="text-muted mb-0">
            Your cricketing skills will appear here once you register for a cricket tournament.{' '}
            <Link to="/tournaments">Browse tournaments</Link>
          </p>
        )}
      </Card.Body>
    </Card>
  )
}
