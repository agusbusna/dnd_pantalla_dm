import styles from './RoundBanner.module.css'

export default function RoundBanner({ round }) {
  return (
    <div className={styles.wrap}>
      <span className={styles.label}>Ronda</span>
      <span className={styles.number}>{round}</span>
    </div>
  )
}
