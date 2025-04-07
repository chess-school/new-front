import { LeftOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { NavLink } from 'react-router-dom';

import './styles.scss';

interface PageTitleProps {
  text: string;
  backLinkText?: string;
  backLinkPath?: string;
  resetMargin?: boolean;
  relative?: 'route' | 'path';
  inline?: boolean;
  state?: any;
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
  <div className={classNames('PageTitle', { flex: inline })}>
    {backLinkText && backLinkPath && (
      <NavLink
        className={classNames('PageTitle__back fl-inline', { 'PageTitle__back--no-margin': inline })}
        to={backLinkPath}
        relative={relative}
        state={state}
      >
        <LeftOutlined /> {backLinkText}
      </NavLink>
    )}
    <h2 className={classNames('PageTitle__head', { 'PageTitle__head--no-margin': resetMargin || inline })}>{text}</h2>
  </div>
);

export default PageTitle;
