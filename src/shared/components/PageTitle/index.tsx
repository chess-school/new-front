import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { NavLink } from 'react-router-dom';

import './styles.scss';

// Мини-замена classnames (удалён вместе с antd-экосистемой, A.2).
const cx = (...parts: Array<string | false | null | undefined>): string => parts.filter(Boolean).join(' ');

interface PageTitleProps {
  text: string;
  backLinkText?: string;
  backLinkPath?: string;
  resetMargin?: boolean;
  relative?: 'route' | 'path';
  inline?: boolean;
  state?: unknown;
}

const PageTitle: React.FC<PageTitleProps> = ({
  text,
  backLinkText,
  backLinkPath,
  resetMargin = false,
  relative = 'route',
  inline = false,
  state,
}) => (
  <div className={cx('PageTitle', inline && 'flex')}>
    {backLinkText && backLinkPath && (
      <NavLink
        className={cx('PageTitle__back fl-inline', inline && 'PageTitle__back--no-margin')}
        to={backLinkPath}
        relative={relative}
        state={state}
      >
        <ChevronLeftIcon fontSize="small" sx={{ verticalAlign: 'middle' }} /> {backLinkText}
      </NavLink>
    )}
    <h2 className={cx('PageTitle__head', (resetMargin || inline) && 'PageTitle__head--no-margin')}>{text}</h2>
  </div>
);

export default PageTitle;
